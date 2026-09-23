# Implementation Plan — منصة مسجد النور (Admin & School Management)

Status: **IMPLEMENTED — all code phases complete; live against the real Firebase project.** Remaining: rules-emulator tests (need Java) and Playwright e2e. This document is the reference for the increment; it was produced from a full audit of the existing codebase, reuses existing schemas/components, and flags gaps/migration risks.

## Progress log

| Phase | Scope | Status |
|---|---|---|
| 0 — App audit | (complete) | ✅ |
| 1 — Firebase/Firestore audit | (complete) | ✅ |
| 2 — Data model | additive schema fields + `User` type | ✅ |
| 3 — Migration / injection | `--write` importer path + backup | ✅ (Firestore seeded: 142 members · 1,040 pledgeMonths · 33 families · 59 students · 297 invoices · 120 donations · 74 expenses · 2 transfers · settings) |
| 4 — Auth / authorization | Admin SDK, server actions, `useAuth`/`RequireRole`, login, `/ar/users` | ✅ (code + admin user live) |
| 5 — المسجد members | `MemberForm` add/edit/archive (reuses `Member` fields) | ✅ |
| 6 — المدرسة | tabs العائلات/الطلاب/الفصول + CRUD + assignments | ✅ |
| 7 — المعلمون والرواتب | teachers CRUD + Arabic salary calendar (checkbox persistence) | ✅ |
| 8 — Settings | admin-only edit (forms + gating) | ✅ (SettingsForm + RequireRole admin) |
| 9 — UI / RTL / dark | preserved (Zellige theme-aware already in place) | ✅ |
| 10 — Security | rules update (`classes`, `settings`) + server auth | ✅ (rules add classes/settings/attendance; server auth done) |
| 11 — Testing | unit tests green (92); rules/e2e pending | 🔶 rules tests need Java emulator; e2e pending |
| 12 — Order | (n/a) | — |

**Live now:** Firestore client config in `.env.local`, Admin SDK verified (read-only
connectivity), Email/Password enabled, bootstrap admin `admin@admin.com` created
with `role:"admin"` claims + `users/{uid}` profile. **Real data seeded** via
`scripts/import-excel.ts --write` (idempotent upsert by deterministic doc id).

**Deviation from plan:** archive (`isActive`) was also added to `Family` and `Student`
(beyond Teachers + Classes) for full CRUD symmetry; CRUD lives in `src/lib/crud.ts`
(separate from `mutations.ts`) to keep files focused.

---

## PHASE 0 — Existing Application Audit

**Stack (verified from `package.json` / repo):**
- Next.js **15.5.25** (App Router), React 19, TypeScript **strict** (`no any`), Tailwind v4
- Firebase (client SDK `firebase` v12), `@tanstack/react-query`, `@umalqura/core`, `xlsx`, `date-fns`
- Testing: Vitest (81 unit tests), `@firebase/rules-unit-testing` (rules tests written, not runnable locally)

**Directory structure (relevant):**
```
src/app/[locale]/…            # locale routes (ar default RTL, es, ca)
src/app/layout.tsx            # root: html lang/dir from NEXT_LOCALE cookie
src/middleware.ts             # / → /ar redirect + cookie
src/components/               # Money, MonthGrid, DirectoryList, Providers,
                              # ThemeToggle, ZelligeBackground (layout/), RecordPaymentDialog,
                              # ReportCard, DonationBanner, DashboardView
src/components/lists/         # one list/grid component per domain collection
src/lib/                      # schema, money, dates, hijri, fridays, fees, ledger,
                              # treasury, excel, matching, mutations, export,
                              # organization, grid
src/lib/data/hooks.ts         # all TanStack Query hooks
src/lib/firebase/             # config, auth (types only), appCheck
src/lib/firestore/client.ts   # getFirestoreDb() client instance
scripts/import-excel.ts       # dry-run importer → migration-report.json
firestore.rules               # rules v2 (custom claims: role, familyId)
tests/rules/                  # emulator rules tests
docs/                         # PHASE-LOG, MANUAL.ar, HANDOVER
```

**Existing routes (verified):**
- `/[locale]` — dashboard · `/[locale]/masjid/{members,donations,donations/friday,expenses,transfers,recurring,treasury}`
- `/[locale]/school/{families,students,invoices,grades,attendance,teachers,salary}` · `/[locale]/school/students/[id]/report`
- `/[locale]/{events,announcements,prayer-times,donate}` · `/[locale]/settings`, `/[locale]/settings/audit`

**Authentication:** **NOT implemented.** No login page, no sign-in flow, no `onAuthStateChanged`, no custom-claims enforcement in the UI. `src/lib/firebase/auth.ts` only defines the `AppRole`/`AppClaims` **types** (`admin | treasurer | teacher | parent | viewer`, `familyId`). `getAuth()` helper exists but is unused.

**Authorization:** **NOT enforced.** No role gating anywhere; every page renders for everyone. Rules reference `request.auth.token.role` but no `setUserRole` callable / Cloud Function / Admin SDK exists to set those claims.

**Firestore client:** configured via `NEXT_PUBLIC_FIREBASE_*` env (`getFirebaseApp()` returns `null` when unconfigured → every `useCollection` hook returns `[]`). **No `.env.local` with real values is present.**

**Firebase Admin SDK:** **NOT used** in the app. Only referenced as a future path for `scripts/import-excel.ts --write` and Cloud Functions (plan §10, deferred).

**Server actions / API routes:** **none.** All data access is client-side Firestore via hooks. There is no server-side authorization surface today.

**Existing UI primitives (reuse these):** `DirectoryList` (searchable table + empty state), `MonthGrid` (shared month grid + cell click → `RecordPaymentDialog`), `Money` (bidi-isolated), `ThemeToggle`, `ZelligeBackground` (`.zellige-background`, theme-aware), brand tokens (`--nour-*` + semantic `--background/--surface/--primary/--accent/…`).

**Audit logging:** `AuditLog` type + `useAuditLog()` + `settings/audit` viewer exist, but **nothing writes auditLog** (intended Cloud Function, not built).

---

## PHASE 1 — Firebase / Firestore Audit

**Firebase config:** `src/lib/firebase/config.ts` — `initializeApp` with `NEXT_PUBLIC_FIREBASE_API_KEY/AUTH_DOMAIN/PROJECT_ID/STORAGE_BUCKET/MESSAGING_SENDER_ID/APP_ID`. Project id `masjid-nour`. App Check helper `src/lib/firebase/appCheck.ts` (reCAPTCHA v3, env-gated, not wired into `getFirebaseApp`).

**Collections (declared in `schema.ts` + rules), current Firestore state = EMPTY (no data written):**

| Collection | Type | Key fields | Notes |
|---|---|---|---|
| `persons` | Person | canonicalName, aliases[], phone?, email?, links{familyId?,memberId?,teacherId?} | directory, never auto-merged |
| `members` | Member | personId?, fullName, monthlyPledgeCents, startMonth, endMonth?, status, notes, isActive | **no phone/email/contact** |
| `pledgeMonths` | PledgeMonth | memberId, month, expectedCents, paidCents, status | month-key `"2026-01"` |
| `families` | Family | parentName, phone?, email?, reserved?, notes | |
| `students` | Student | familyId, name, level, englishEnrolled, reserved? | **NO `classId`** |
| `classes` | Class | name, teacherId?, notes | |
| `teachers` | Teacher | personId?, fullName, phone?, notes | **NO `email`, NO `monthlySalaryCents`** |
| `salaryPayments` | SalaryPayment | teacherId, month, expectedCents, paidCents, status, notes | **NO `paidAt`/`year`** |
| `invoices` / `payments` / `donations` / `funds` / `campaigns` / `recurringExpenses` / `vendors` / `expenses` / `transfers` | (money ledger) | see `schema.ts` | append-only movements |
| `grades` / `attendance` | Grade / Attendance | studentId, familyId, subject/score, date/status | |
| `events` / `prayerTimes` / `announcements` | … | | |
| `settings` | Settings | pricing{…}, organization{…} | **not written; `organization.ts` is a hard-coded fallback** |
| `auditLog` | AuditLog | action, who, what, before?, after?, at | viewer exists; no writer |
| `users` | **no TS type yet** | (rules reference `users/{uid}`) | missing User type |

**Security rules (`firestore.rules`):** v2, role functions `isAdmin/isFinance/isStaff`, `myFamily()`. Key rules: `users` read self-or-admin / write admin; `members`/`pledgeMonths` finance-only; `payments`/`transfers` create-only (no update/delete); `auditLog` admin-read, write false. **No rules for `classes`** (missing match block) — flagged.

**Existing data:** none in Firestore. `scripts/import-excel.ts` (dry-run) produces `migration-report.json` with verified reconciliation targets, but nothing is written.

---

## PHASE 2 — Data Model (proposed, additive)

Relationships use **stable document IDs**, never names.

```
User (Firebase Auth uid)
  ├─ users/{uid}   { email, role, familyId?, memberId?, disabled?, … }   ← NEW type
  └─ (role via custom claims)

Member ──< PledgeMonth (memberId)
Family ──< Student (familyId)
Class  ──< Student (classId)          ← ADD classId to Student
Class  ──< Teacher (teacherId)        (already exists on Class)

Teacher ──< SalaryPayment (teacherId, month)   ← add monthlySalaryCents to Teacher
```

**Additive schema changes (no destructive changes):**
1. `Student.classId?: string` — new optional field (back-compatible).
2. `Teacher.email?: string` — new optional field.
3. `Teacher.monthlySalaryCents?: Cents` — new optional field (drives salary table).
4. `Teacher.isActive?: boolean` — archive/disable flag (default `true`; `false` = archived). Reuses the `isActive` pattern already on `Member`.
5. `Class.isActive?: boolean` — archive/disable flag (default `true`; `false` = archived).
6. `SalaryPayment.paidAt?: string` — new optional field (when marked paid). `month` already encodes `"YYYY-MM"` (no separate `year` needed — document this decision).
7. New `User` type: `{ id(uid), email, role, familyId?, memberId?, disabled? }` in `users/{uid}` (profile mirror, written server-side).
8. `Member` reuse existing fields; **do not add** phone/email unless the association provides contact data (open question Q6) — flagged, not silently invented.

**Archive convention (consistent across all entities):** soft-delete only — `isActive: false`. Archived rows are hidden from lists by default (with a toggle to reveal), are excluded from assignment selectors (family/class/teacher dropdowns), and **never hard-deleted** while referenced by students, salary history, or pledges. Relationships (IDs) remain intact so history stays readable. Families and Students already carry `reserved?`; if full symmetry is later required they can adopt the same `isActive` flag without migration risk.

Unique constraints: `salaryPayments` unique on `(teacherId, month)`; `users` keyed by Auth `uid`.

---

## PHASE 3 — Data Migration / Injection

**Current state:** Firestore empty. Two data sources exist: (a) `scripts/import-excel.ts` dry-run output, (b) nothing else.

**Non-destructive strategy:**
1. Add `--write` path to `scripts/import-excel.ts` using **Admin SDK** + the service-account key (gitignored). Import order: persons → masjid → school → links → transfers → reconciliation (already coded).
2. Idempotency: deterministic doc IDs (already used: `member-{n}`, `invoice-{name}-{month}`, etc.) so re-running upserts rather than duplicates. Add an `upsert`/merge step keyed by those IDs before any write.
3. **Backup first** (see HANDOVER §7): enable a one-time/manual Firestore export before the first `--write`.
4. `settings` document: write the pricing + organization (IBAN, titular, concepto) from the workbook, replacing the `organization.ts` fallback as the source of truth.

**No production data to preserve today** (collections empty); the risk is only *future* data, hence idempotent-upsert + backup discipline from the start.

---

## PHASE 4 — Authentication / Authorization

**Add a real auth layer (currently missing).** Architecture:

```
Browser → server action / API route (Next.js route handler)
        → Firebase Admin SDK (initializeApp with service account, server-only)
        → Firebase Auth (createUser/updateUser/setCustomUserClaims)
        → Firestore users/{uid} profile write
```

1. **Login** — `/[locale]/(auth)/login` (email+password for staff; phone OTP for parents is Phase-later). Reuse i18n keys `login`.
2. **Admin SDK** — new `src/lib/firebase/admin.ts` (server-only, `firebase-admin` dep), guarded: never imported into client components; reads service-account creds from `FIREBASE_SERVICE_ACCOUNT_*` env (server-only, not `NEXT_PUBLIC_`).
3. **Server actions** — `src/app/[locale]/actions/` (or `src/server/`): `createUser`, `updateUserRole`, `resetPassword`, `disableUser`. All enforce `isAdmin` **server-side** (verify the caller's custom claims via Admin SDK, never trust client).
4. **Custom claims** — extend `AppRole` usage: `setCustomUserClaims(uid, { role, familyId })`; mirror to `users/{uid}`.
5. **Client auth state** — a small `useAuth()` hook + role gate component (e.g. `<RequireRole role="admin">`) for UI gating; server actions are the real boundary.
6. **Firestore rules** — keep as-is; add a `classes` match block; ensure `users` write is admin-only (already is).

Passwords are **never** stored in Firestore — handled entirely by Firebase Auth.

---

## PHASE 5 — المسجد — Members

Route `/ar/masjid/members` currently renders `MembersGrid` (read-only month grid). Add CRUD:

- **List** (exists — `MonthGrid`), **Add** (`MemberForm`), **Edit**, **View** (member detail + pledge history), **Archive** (`isActive=false` — reuse existing field; never hard-delete a member with pledge history), **Search** (name).
- **Reuse `Member` fields exactly**: `fullName`, `monthlyPledgeCents` (default 1000), `startMonth`, `status` (derived), `notes`, `isActive`.
- Mutations: add `recordMember`/`updateMember`/`archiveMember` to `src/lib/mutations.ts` (append-only philosophy; member updates are allowed — not financial movements — but audit them).
- Validation (Arabic messages): name required, monthlyPledgeCents positive integer.

---

## PHASE 6 — المدرسة — School Management

Reorganize `/ar/school/families` into **three tabs** using existing i18n labels:

```
/ar/school/families
  [ العائلات ] [ الطلاب ] [ الفصول ]
```

Use a shared `Tabs` client component; keep the existing routes (`/school/students`, `/school/classes`) as deep-links into the same tabbed page (or redirect to the tab).

### Families tab
- List (reuse `DirectoryList`), Add, Edit, View (family → its students), Search.
- Reuse `Family` fields. Students assigned via `student.familyId`.

### Students tab
- List (reuse `DirectoryList`), Add, Edit, View, Search/filter.
- Assign to family (dropdown → `familyId`), assign/change class (dropdown → `classId`), show current/unassigned.

### Classes tab
- List, Add, Edit, View (students in class), Archive (`isActive=false`).
- Assign teacher (`class.teacherId` via teacher selector), assign/remove students (`student.classId`).
- Archived classes hidden from student-assignment selector by default.

All assignments use stable IDs. Mutations: `recordFamily/updateFamily`, `recordStudent/updateStudent`, `recordClass/updateClass` (+ audit).

---

## PHASE 7 — المعلمون والرواتب

Route `/ar/school/teachers-salaries` (new). Two sub-views:

### Teachers
- List (reuse `DirectoryList`), Add, Edit, Search, Archive (`isActive=false`).
- Fields: `fullName` (اسم المعلم), `phone` (الهاتف), `email` (البريد الإلكتروني — **add field**).
- Assign teacher to class (`class.teacherId`).
- Archived teachers hidden from class-assignment selector by default; salary history preserved.

### Salary table + Arabic monthly calendar
- Table columns: `اسم المعلم | الراتب الشهري (€) | ملاحظات | المجموع` + month cells (يناير…ديسمبر).
- The `"/"` column from the request is a **formatting artifact** (a separator), has no business meaning in the current model → **omit it**; document this decision.
- `monthlySalaryCents` on `Teacher`; `salaryPayments/{id}` records `(teacherId, month, expectedCents, paidCents, status, paidAt?, notes)`.
- Calendar uses `MonthGrid`-style layout with **checkboxes** per teacher×month; marking paid writes/updates a `SalaryPayment` (unique on `teacherId+month`, idempotent upsert).
- Months in Arabic (يناير…ديسمبر), Latin digits for money via `Money`.
- Store numeric cents, never formatted strings.

---

## PHASE 8 — Settings

`/ar/settings` — **admin-editable only**. Reuse `Settings` type (`pricing`, `organization`).
- Enforce at: (1) UI (`<RequireRole admin>`), (2) server action (Admin SDK claim check), (3) rules (`settings` write = admin only — add if missing).
- Validate: pricing positive integers; IBAN format.
- Non-admin can view (read) if rules permit; never modify.

---

## PHASE 9 — UI / RTL / Dark Mode

- Everything stays `dir="rtl"` Arabic-first; reuse `dirFor(locale)`, logical properties.
- **Zellige background** already theme-aware (`.zellige-background` + `--zellige-image` light/dark SVG). Keep the light/dark inversion (dark = deep green `#064B38` + light lines; light = ivory `#F8F7F2` + darker lines). New UI must NOT override it.
- New forms/dialogs: reuse `RecordPaymentDialog` pattern, `DirectoryList` empty/loading states, `Money`, semantic tokens (`bg-surface`, `text-foreground`, `border-border`, `bg-primary`), not hardcoded white/black.

---

## PHASE 10 — Security

- **Firestore rules**: add a `classes` match block; add `settings` admin-write; verify `users` admin-only; keep append-only on `payments`/`transfers`/`donations`/`expenses`.
- **Server-side authorization**: every admin action goes through a server action / route handler that verifies the caller's custom claims via Admin SDK (never trust the client).
- **Admin SDK**: server-only module; service-account creds only in server env (`FIREBASE_SERVICE_ACCOUNT_*`), never `NEXT_PUBLIC_`, never in client bundles.
- **Passwords**: Firebase Auth only; never in Firestore.

---

## PHASE 11 — Testing

| Area | Tests |
|---|---|
| Auth | login success/fail; custom-claim set/verify |
| Authorization | admin can CRUD users/settings/members/classes/salaries; non-admin gets 403/denied at **server action** level and rules level |
| CRUD | member/family/student/class/teacher add-edit-archive |
| Relationships | student→family, student→class, teacher→class (reassign keeps IDs stable) |
| Salary | monthlySalaryCents stored numeric; payment upsert idempotent on `teacherId+month`; marking paid sets `paidAt`+`status` |
| Firestore rules | extend `tests/rules/` (needs emulator + Java — see HANDOVER): parent can't read other family; teacher can't read pledges; payments no update/delete; settings admin-only; classes role-gated |
| RTL / dark / mobile | Playwright in Arabic locale for members grid + school tabs + salary calendar; dark-mode Zellige inversion; mobile responsive |

---

## PHASE 12 — Implementation Order

1. **Firestore connection** — `.env.local`, verify `getFirebaseApp()`/`getFirestoreDb()` (client) + add server-only Admin SDK module.
2. **Auth foundation** — login route, `useAuth`, `<RequireRole>`, `setUserRole` server action, `users/{uid}` mirror.
3. **User management** — `/ar/users` (admin): list, create (email+temp password), reset password, disable; all via Admin SDK.
4. **Members CRUD** — `/ar/masjid/members` add/edit/archive.
5. **School tabs** — refactor `/ar/school/families` → العائلات / الطلاب / الفصول.
6. **Families/Students/Classes CRUD + assignments** (family↔student, student↔class, teacher↔class).
7. **Teachers & salaries** — `/ar/school/teachers-salaries`, salary table + Arabic monthly calendar + payment persistence.
8. **Settings admin-only** — edit forms + server + rules.
9. **Rules update + tests** — `classes`/`settings` rules, extend rules tests, Playwright, Lighthouse.
10. **Audit logging** — Cloud Function writes auditLog for the admin actions (reuse existing AuditLog type/viewer).

---

## Definition of Done

- [ ] Firestore connected (client + server Admin SDK), real env, no secrets in client
- [ ] Existing data preserved; import idempotent + backup
- [ ] Login + roles enforced server-side (claims) and in rules
- [ ] Admin user management (create / reset password / disable) via Auth, no plaintext passwords
- [ ] `/ar/masjid/members` add/edit/archive reusing `Member` fields
- [ ] `/ar/school/families` tabs: العائلات / الطلاب / الفصول
- [ ] Families/students/classes CRUD (incl. archive for classes) + student↔family, student↔class, teacher↔class (stable IDs)
- [ ] `/ar/school/teachers-salaries` with teacher fields (incl. archive), monthly salary, notes, Arabic monthly calendar, persistent payment status
- [ ] `/ar/settings` admin-only (UI + server + rules)
- [ ] Firestore rules updated; no `allow read,write: if true`
- [ ] RTL, dark-green theme, theme-aware Zellige preserved; responsive
- [ ] Tests pass; no TypeScript/lint errors

## Schema conflicts / migration risks (flagged)

1. **`Student.classId` missing** → additive optional field.
2. **`Teacher.email` + `Teacher.monthlySalaryCents` missing** → additive optional fields.
3. **`Teacher.isActive` / `Class.isActive` missing** → additive optional fields (archive pattern, mirrors `Member.isActive`).
3. **`SalaryPayment`** has `month`(YYYY-MM) + `paidCents`, no `year`/`paidAt` → reuse; add `paidAt?`; document `(teacherId, month)` uniqueness.
4. **No `User` type** → add; mirror `users/{uid}` (Auth is the identity source).
5. **No `classes` rules block** → add.
6. **`settings` has no writer** (fallback in `organization.ts`) → write a real `settings` doc, rules admin-only.
7. **Members have no contact fields** → do NOT invent; blocked on open question Q6 (documented).
8. **No auth / no Admin SDK / no server actions today** → these are prerequisites, not optional.
9. The `"/"` column in the salary request is a formatting artifact → omit.
