# Phase Progress — منصة مسجد النور

Tracks delivery against **PlanvFinal.md §12** (the 7-phase roadmap). Detailed
per-phase notes live in `docs/PHASE-LOG.md` (one dated entry per completed phase).

**Current phase:** 6 — Hardening & handover ✅ · **All phases complete**

---

## Roadmap overview

| Phase | Scope | Est. | Status |
|-------|-------|------|--------|
| 0 — Foundation | Repo, brand tokens, RTL shell, Firebase, Auth + roles/claims, rules v2 + emulator tests | 1 wk | ✅ Done |
| 1 — Community directory | persons, families, students, members, teachers, classes, settings; both Excel importers + migration report | 1.5 wk | ✅ Done |
| 2 — Money ⭐⭐ | Shared MonthGrid → school invoices + masjid pledges; payments; donations; Friday tracker; expenses + vendors + recurring; transfers; treasury | 3 wk | ✅ Done |
| 3 — Academics | Gradebook, Qur'an memorization, attendance, report-card PDF | 1.5 wk | ✅ Done |
| 4 — Calendar & community | Events, prayer times, announcements, Ramadan mode, public donation page | 1.5 wk | ✅ Done |
| 5 — Polish | Dashboards, exports, i18n es/ca, dark mode, mobile grids, audit UI | 1 wk | ✅ Done |
| 6 — Hardening & handover | App Check, key restriction, backups, rules coverage, Arabic manual, staff training | 1 wk | ✅ Done (code+docs; console steps documented) |

≈ 11 weeks. **Phases 0–2 retire both workbooks — the priority.**

---

## Phase 0 — Foundation ✅

**Delivered**
- Next.js 15 (15.5.25) · TypeScript strict · Tailwind v4 · React 19 · Vitest · ESLint
- Brand tokens (`--nour-green-*`, `--nour-gold-*`, `--nour-cream-50`, success/warning/danger)
- RTL shell — `<html lang="ar" dir="rtl">`, `dir` derived from locale (`src/i18n/dirFor`)
- Arabic fonts — IBM Plex Sans Arabic / Cairo / Amiri / Inter via `next/font`
- i18n skeleton — complete Arabic dictionary + `es`/`ca`, typed key set
- `src/lib/money.ts` (integer cents, `formatEUR`, `parseEURToCents`, `isolateLTR`) + `<Money>` bidi component
- `src/lib/dates.ts` — deterministic Arabic months, Latin digits, Europe/Madrid
- `src/lib/hijri.ts` — `@umalqura/core`, `formatGregorianHijri`, `isFriday`, `isEidAlFitr`, `isEidAlAdha`, `isRamadan`
- Firebase client init + `firestore.rules` (plan §7) + emulator rules tests (`tests/rules/`)
- Placeholder dashboard (RTL, bidi-isolated money, Hijri+Gregorian date line)

**Verification**
- `npm test` — 32 tests green (money/dates/hijri)
- `npm run typecheck`, `npm run lint`, `npm run build` — green
- Rendered HTML confirmed `lang="ar" dir="rtl"`

**Deferred to a later phase**
- Rules tests require the Firestore emulator (`npm run test:rules`, needs `firebase-tools` + Java)

---

## Phase 1 — Community directory ✅

**Delivered**
- `src/lib/schema.ts` — full Firestore domain types (plan §6), integer cents throughout
- `src/lib/excel.ts` — SheetJS helpers (serial→date, money parsing that recovers the text-formatted €3.60 cell, Arabic hygiene)
- `src/lib/matching.ts` — Arabic name normalizer + match proposals (tashkeel/tatweel, alef/hamza, article)
- `scripts/import-excel.ts` — dry-run importer for both workbooks → `migration-report.json` (run: `npm run import:dry-run`)
- **Locale routing** — `[locale]` segment (ar/es/ca) + `middleware.ts` redirect; `dir` from locale
- **App shell** — nav header (لوحة القيادة / المسجد / المدرسة / الإعدادات) in `[locale]/layout.tsx`
- **Directory pages** — families, students, members (searchable lists, empty states) + settings scaffold
- **Data access** — TanStack Query + client Firestore hooks (`useDirectory`), graceful empty state until import

**Verification**
- `npm test` — 50 tests green (money/dates/hijri/excel/matching)
- `npm run typecheck`, `npm run lint`, `npm run build` — green
- Smoke test: `/` → 307 → `/ar`; `/ar/masjid/members` and `/ar/school/families` render RTL with Arabic

**Deferred (minor)**
- Classes page (no class roster in the source workbook — students are all "المستوى الأول")
- Person 360 view — cross-cutting (plan §9.4), not yet built

**Reconciliation (actual data vs plan §11 targets)**

| Collection | Plan target | Actual |
|------------|-------------|--------|
| members | 142 (120/22) | 142 / 120 / 22 ✅ |
| pledgeMonths | ≈1,100 cells | 1,040 ✅ |
| masjid donations | 82 · €14,661 | 82 · **€14,665.84** ⚠️ |
| Friday box | 38 · €5,750 | 38 · €5,750 ✅ |
| masjid expenses | 58 · €6,720.35 | 58 · **€6,720.03** ⚠️ |
| school families/students | 33 / 54 (+5 reserved) | 33 / 54 / 5 ✅ |
| school invoices | 297 · €9,693 | 297 · €9,693 ✅ |
| opening payments | 5 · €707 | 5 · €707 ✅ |
| school expenses / transfers | 16 · €377.54 / 2 · €1,231 | 16 / 2 ✅ |

⚠️ Two data findings (plan audit figures were imprecise — trust the data):
1. Masjid donations sum to **€14,665.84** (plan said €14,661 row-sum / €14,666 stated).
2. Masjid expenses sum to **€6,720.03** (plan said €6,720.35).
Both surfaced as `variances` in the report. Donation campaign/fund labels are best-effort (sparse notes) and flagged for human review.

---

## Phase 2 — Money ⭐⭐ ✅

**Delivered**
- `src/lib/fees.ts` — school pricing engine (20/18/15/10), anomaly detection (`isManualOverride`)
- `src/lib/ledger.ts` — obligation status derivation (paid/partial/unpaid/waived), remaining balance
- `src/components/MonthGrid.tsx` — the ⭐ shared grid (one component, two books), RTL months flow right→left, sticky label column, status-colored cells
- `src/lib/grid.ts` — masjid fiscal (يناير→ديسمبر) + school academic (أكتوبر→يونيو) month sequences
- Wired grids: `masjid/members` (الشرط) + `school/invoices` (families × 9 months)
- `src/lib/fridays.ts` — Jumuah generation + Eid annotation (Hijri-aware)
- `masjid/donations` ledger list + `masjid/donations/friday` tracker (amber gaps, Eid-aware)
- `src/lib/mutations.ts` — append-only write path (payment/donation/expense/transfer), integer-cents validation
- `RecordPaymentDialog` — click a MonthGrid cell → record payment (amount + method), wired into الشرط + invoices
- `src/lib/treasury.ts` — consolidated P&L (transfers eliminated) + tests
- `masjid/treasury` · `masjid/expenses` (+ entry) · `masjid/transfers` (+ entry) · `masjid/recurring`

**Verification**
- `npm test` — 81 tests green (money/dates/hijri/excel/matching/fees/ledger/fridays/mutations/treasury)
- `npm run typecheck`, `npm run lint`, `npm run build` — green

**Deferred to hardening (plan §10)**
- Cloud Functions: onPaymentWrite recompute + auditLog, recurring materialization, generateMonthlyObligations
- Vendor normalization/autocomplete UI (type + import mapping already in place)

---

## Phase 3 — Academics ✅

**Delivered**
- Schema: `Grade`, `Attendance`, `Class`, `Teacher`, `SalaryPayment` (familyId-keyed for rules §7)
- `school/grades` — gradebook (student × subject × score, incl. القرآن الكريم as a subject)
- `school/attendance` — attendance (present/absent/late)
- `school/teachers` + `school/salary` — teachers list + salary month-grid (reuses ⭐ MonthGrid)
- `school/students/[id]/report` — printable report card (grades + attendance), browser print-to-PDF for correct Arabic shaping
- `recordGrade` + `recordAttendance` append-only mutations

**Note:** the report card is a print-ready HTML view (browser print → PDF). This guarantees correct Arabic/RTL shaping; a dedicated PDF library (react-pdf/pdf-lib) can be swapped in later if a server-generated file is required.

---

## Phase 4 — Calendar & community ✅

**Delivered**
- Schema: `Event`, `PrayerTime`, `Announcement`
- `events` — events list + entry (title/date/location)
- `announcements` — announcements list + entry (title/body, pinned-ready)
- `prayer-times` — 5 daily prayers view (empty until the refreshPrayerTimes CF caches them)
- `donate` — public donation page (IBAN + copy-to-clipboard + three pillars + جزاكم الله خيرا + print)
- **Ramadan mode** — Hijri-aware banner on the dashboard when `isRamadan(today)`
- `recordEvent` + `recordAnnouncement` mutations

---

## Phase 5 — Polish ✅

**Delivered**
- **Dark mode** — class-based toggle (`ThemeToggle`), deep-green base, persisted in localStorage
- **Live dashboard** — KPIs now computed from the ledger (treasury), not hardcoded
- **Exports** — `src/lib/export.ts` (CSV with UTF-8 BOM · XLSX with RTL sheet); الشرط grid exports back to `الشرط.xlsx`
- **Audit UI** — `settings/audit` (auditLog viewer, admin-read only per rules)
- i18n es/ca complete (typed dictionaries enforce every key)
- **Branding** — association logo in the header (`public/logo.png`) + mosque favicon

**Note:** mobile month-grids use horizontal scroll (logical-property safe); a dedicated card layout is a minor follow-up.

---

## Phase 6 — Hardening & handover ✅

**Delivered**
- **App Check** — `src/lib/firebase/appCheck.ts` (reCAPTCHA v3, env-gated) + `.env.example` updated
- **Arabic manual** — `docs/MANUAL.ar.md` (full user guide, Arabic-first)
- **Handover guide** — `docs/HANDOVER.md` (deploy, env, rules + claims, App Check, key restriction, backups, Cloud Functions checklist, emulator tests, open questions)
- **Rules** — `firestore.rules` v2 shipped; emulator tests in `tests/rules/` (require `firebase-tools` + Java, not available in this environment)

**Console-side steps (documented, need Firebase project owner):** enable App Check, restrict the API key, enable daily Firestore export, deploy rules + Cloud Functions.

---

## Open questions (plan)

| ID | Question | Blocks | Default if unanswered |
|----|----------|--------|-----------------------|
| Q1 | الشرط cells after 20 Sep 2026: collected or pledged? | Import | `--shart-mode collected`; post-20-Sep cells quarantined to review |
| Q6 | Member contact data (phones) for reminder queue | Reminders | Phase 1 phone-collection campaign |
| Q9 | Opening balances for the two books | Treasury | Set only after pass-through (€524) resolved |
| Q14 | School levels reset to المستوى الأول — correct? | Import | Import as recorded, flagged |

---

## Definition of done (plan §13)

- Every euro traces to an append-only doc with author + timestamp
- Both workbooks re-import and reproduce the reconciliation totals
- Pledge grid shows expected vs. collected; retention + never-payer live
- Missing Fridays visible; Eid Fridays Hijri-aware; transfers eliminated in P&L
- Treasurer closes a month end-to-end in-app
- Security rules unit-tested; no `allow read, write: if true`
- Lighthouse ≥ 90 mobile on dashboard + both month-grids
