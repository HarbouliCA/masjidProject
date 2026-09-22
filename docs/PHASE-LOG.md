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
