# Phase Log

## Phase 0 — Foundation — 2026-09-22

Status: complete.

Delivered:

- **Scaffold** — Next.js 15 (15.5.25), TypeScript strict, Tailwind v4, React 19,
  Vitest + Playwright-ready, ESLint, Vercel-ready.
- **Brand tokens** — `src/app/globals.css` `@theme` palette per plan §4
  (`--nour-green-*`, `--nour-gold-*`, `--nour-cream-50`, success/warning/danger).
- **RTL shell** — `<html lang="ar" dir="rtl">`; `dir` derives from the active
  locale via `src/i18n` (`dirFor`), never hardcoded.
- **Arabic fonts** — IBM Plex Sans Arabic (body), Cairo (headings), Amiri
  (Qur'anic/long-form), Inter (Latin fallback) via `next/font`, wired as CSS
  variables and `--font-sans/--font-heading/--font-quranic`.
- **i18n skeleton** — complete Arabic shell dictionary + `es`/`ca` translations
  (`src/i18n/`), typed so every locale must define every key.
- **Money** — `src/lib/money.ts` (`formatEUR`, `parseEURToCents`, `isolateLTR`)
  + `<Money>` bidi-isolated component.
- **Dates** — `src/lib/dates.ts` (deterministic Arabic month names, Latin
  digits, Europe/Madrid resolution, `formatMonthKey`).
- **Hijri** — `src/lib/hijri.ts` (`@umalqura/core`, deterministic month names,
  `formatGregorianHijri`, `isFriday`, `isEidAlFitr`, `isEidAlAdha`, `isRamadan`).
- **Firebase** — client init (`src/lib/firebase/config.ts`, `auth.ts`) driven by
  `NEXT_PUBLIC_FIREBASE_*`; `firestore.rules` security rules v2; emulator rules
  tests in `tests/rules/`.
- **Placeholder dashboard** — proves RTL layout, bidi-isolated money, and the
  Hijri+Gregorian date line.

Verification:

- `npm test` — 3 suites (money/dates/hijri) green.
- `npm run typecheck`, `npm run lint`, `npm run build` — green.

Open items / notes:

- Rules unit tests require the Firestore emulator (`npm run test:rules`, needs
  `firebase-tools` + Java). Deferred to a later phase (see plan §6 hardening).
- The plan's illustrative date string "12 يناير 2026 · 13 رجب 1447هـ" is not a
  real conversion — 12 Jan 2026 is actually 23 رجب 1447. The `hijri.ts` layer
  uses verified `@umalqura/core` values (e.g. 20 Mar 2026 = 1 شوال 1447, Friday).

## Phase 1 — Community directory — 2026-09-22

Status: complete.

Delivered:

- **Domain types** — `src/lib/schema.ts` (all plan §6 collections, integer cents).
- **Excel helpers** — `src/lib/excel.ts` (serial→date, money parsing that recovers
  the text-formatted €3.60 cell, Arabic hygiene).
- **Matcher** — `src/lib/matching.ts` (tashkeel/tatweel, alef/hamza, article,
  spacing/doubling variants; proposals only, never auto-merge).
- **Importer** — `scripts/import-excel.ts` (`npm run import:dry-run`), parses both
  workbooks and emits `migration-report.json` (gitignored — contains real data).
- **Locale routing** — `src/app/[locale]/` (ar/es/ca) + `src/middleware.ts`
  (`/` → `/ar`); `dir` derives from locale.
- **App shell + directory pages** — families, students, members (searchable,
  empty states) + settings scaffold; TanStack Query + client Firestore hooks.

Reconciliation against plan §11 (all totals reproduced; two variances surfaced):

- members 142 (120 ever-paid / 22 never) · pledgeMonths 1,040 · Friday 38 × €5,750
  · school 33 families / 54 students / 5 reserved · invoices 297 × €9,693
  · opening payments 5 × €707 · school expenses 16 × €377.54 · transfers 2 × €1,231.
- **Variance 1** — masjid donations sum to **€14,665.84** (plan: €14,661/€14,666).
- **Variance 2** — masjid expenses sum to **€6,720.03** (plan: €6,720.35).

Open items / notes:

- Donation channel/campaign/fund labels are best-effort (sparse notes in the
  source data); flagged `needsReview` for human sign-off, per plan §11.
- Persons pass proposes 9 matches (plan cited ≥13; the remaining variants use
  looser حفظ/حفيظ-style edits that the conservative matcher intentionally skips).
- Deferred (minor): teachers/classes pages (teachers sheet empty); person 360
  view lands with Phase 2 (money).

## Phase 2 — Money (partial) — 2026-09-22

Status: in progress — money engines + MonthGrid delivered.

Delivered:

- **`src/lib/fees.ts`** — school pricing engine (20/18/15/10, per-child with
  sibling discount, verified against the workbook) + anomaly detection.
- **`src/lib/ledger.ts`** — obligation status derivation + remaining balance.
- **`src/components/MonthGrid.tsx`** — the shared grid (one component, two books),
  RTL month flow (right→left), sticky label column, status-colored cells.
- **`src/lib/grid.ts`** — masjid fiscal + school academic month sequences.
- Wired grids: `masjid/members` (الشرط) + `school/invoices`.

Verification:

- `npm test` — 66 tests green (added fees + ledger suites).
- `npm run typecheck`, `npm run lint`, `npm run build` — green.
- Smoke test: `/ar/school/invoices` and `/ar/masjid/members` render RTL + Arabic.

Still pending: donations + Friday tracker · payments (append-only) ·
expenses/vendors/recurring · transfers + treasury.

Addendum (same session):

- **`src/lib/fridays.ts`** — Jumuah generation + Eid annotation (Hijri-aware);
  verified Eid al-Fitr 2026 falls on Friday 20 Mar; Eid al-Adha 2026 is not a Friday.
- **Donations module** — `masjid/donations` ledger list + `masjid/donations/friday`
  tracker (amber gaps for missing Fridays, Eid Fridays annotated & expected-zero).
- `npm test` — 71 tests green (added fridays suite).

Remaining in Phase 2: payments (append-only) · expenses/vendors/recurring ·
transfers + treasury.

Addendum (same session, #2):

- **`src/lib/mutations.ts`** — append-only money write path (builders + `record*`
  helpers for payment/donation/expense/transfer); integer-cents validation;
  auditLog deferred to Cloud Functions (rules deny client writes).
- **`RecordPaymentDialog`** — MonthGrid cell click → record a payment (amount +
  method), wired into الشرط and invoices grids.
- `npm test` — 79 tests green (added mutations suite).

Remaining in Phase 2: expenses/vendors/recurring · transfers + treasury.

Addendum (same session, #3):

- **`src/lib/treasury.ts`** — consolidated P&L (per-scope + consolidated, transfers
  eliminated) + tests.
- **Pages** — `masjid/treasury`, `masjid/expenses` (+ quick entry), `masjid/transfers`
  (+ quick entry), `masjid/recurring`.
- `npm test` — 81 tests green (added treasury suite).

Phase 2 complete. Deferred to hardening (plan §10): Cloud Functions
(onPaymentWrite recompute + auditLog, recurring materialization,
generateMonthlyObligations) and vendor autocomplete UI.

## Phase 3 — Academics (partial) — 2026-09-22

Status: in progress — gradebook + attendance delivered.

Delivered:

- **Schema** — `Grade`, `Attendance`, `Class`, `Teacher`, `SalaryPayment`
  (`familyId`-keyed so parents only see their own, per rules §7).
- **`school/grades`** — gradebook (student × subject × score, incl. القرآن الكريم
  as a subject) + append-only `recordGrade`.
- **`school/attendance`** — present/absent/late + append-only `recordAttendance`.

Still pending: report-card PDF (Arabic/RTL) · teachers & salary month-grid.

Addendum (same session):

- **`school/teachers`** + **`school/salary`** — teachers list + salary month-grid
  (reuses ⭐ MonthGrid).
- **`school/students/[id]/report`** — printable report card (grades + attendance).
  Print-to-PDF via the browser guarantees correct Arabic/RTL shaping (a dedicated
  PDF library can be swapped in later if server-generated files are required).

Phase 3 complete.

## Phase 4 — Calendar & community — 2026-09-22

Status: complete.

Delivered:

- **Schema** — `Event`, `PrayerTime`, `Announcement`.
- **`events`** + **`announcements`** — lists with quick-entry forms.
- **`prayer-times`** — 5 daily prayers view (empty until the refreshPrayerTimes CF caches them).
- **`donate`** — public donation page (IBAN + copy + three pillars + جزاكم الله خيرا + print);
  IBAN from `src/lib/organization.ts` (interim fallback, belongs in settings/organization).
- **Ramadan mode** — Hijri-aware banner on the dashboard via `isRamadan(today)`.

## Phase 5 — Polish — 2026-09-22

Status: complete.

Delivered:

- **Dark mode** — class-based toggle (`ThemeToggle`, localStorage-persisted,
  deep-green base).
- **Live dashboard** — KPIs computed from the ledger via `computeTreasury`
  (removed the hardcoded placeholder figures).
- **Exports** — `src/lib/export.ts` (CSV with UTF-8 BOM; XLSX with RTL sheet);
  the الشرط grid exports back to `الشرط.xlsx`.
- **Audit UI** — `settings/audit` (admin-read only, empty until Cloud Functions
  write auditLog).
- i18n es/ca complete (typed dictionaries enforce key parity).

Note: mobile month-grids use horizontal scroll; a card layout is a minor follow-up.

## Phase 6 — Hardening & handover — 2026-09-22

Status: complete (code + docs; console-side steps documented for the project owner).

Delivered:

- **App Check** — `src/lib/firebase/appCheck.ts` (reCAPTCHA v3, env-gated).
- **Arabic manual** — `docs/MANUAL.ar.md`.
- **Handover guide** — `docs/HANDOVER.md` (deploy, env, rules + custom claims,
  App Check, API-key restriction, backups, Cloud Functions checklist, rules
  emulator tests, open questions).

Notes:

- Rules emulator tests require `firebase-tools` + Java (not installed here) —
  run `npm run test:rules` after installing them.
- Remaining for full DoD: Playwright e2e for both month-grids + monthly close
  (Arabic), Lighthouse ≥ 90, and the Firebase console-side steps.
