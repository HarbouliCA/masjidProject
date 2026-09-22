# Handover & Operations — منصة مسجد النور

Checklist to take the app from local → production. Firebase project: **masjid-nour**.

## 1. Configure the client

Copy `.env.example` → `.env.local` and fill every `NEXT_PUBLIC_FIREBASE_*` value
from **Firebase console → Project settings → Your apps → Web app**.

## 2. Seed real data (retire the workbooks)

The importer (`scripts/import-excel.ts`) is dry-run only. To write to Firestore:

1. Install `firebase-admin` and add a `--write` path using the service-account key
   (kept out of git — see `.gitignore`).
2. Run `npm run import:dry-run` first and review `migration-report.json`, then write.
3. Verify the reconciliation targets (plan §11). Two data variances to sign off:
   - Masjid donations **€14,665.84** (plan said €14,661/€14,666)
   - Masjid expenses **€6,720.03** (plan said €6,720.35)

## 3. Deploy security rules

```
firebase deploy --only firestore:rules
```

Then set custom claims for each user (the real boundary):

```
firebase auth:set-custom-user-claims <uid> '{"role":"treasurer"}'
firebase auth:set-custom-user-claims <uid> '{"role":"parent","familyId":"<id>"}'
```

Roles: `admin` · `treasurer` · `teacher` · `parent` · `viewer`.

## 4. Enable App Check

1. Firebase console → App Check → register a **reCAPTCHA v3** site.
2. Put the site key in `NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY`.
3. Enforce App Check on Firestore (and Auth/Storage).

## 5. Restrict the API key

Google Cloud → APIs & Services → Credentials → the Web API key →
**Application restrictions → HTTP referrers** → add the Vercel domain.
Rotate any key that was committed or exposed.

## 6. Build & deploy the Cloud Functions (plan §10)

- `onUserCreate` — default role + `users/{uid}` mirror
- `setUserRole` — admin-only callable → custom claims
- `generateMonthlyObligations` — 1st of month → invoices + pledgeMonths
- `onPaymentWrite` — recompute invoice/pledgeMonth status + write **auditLog**
- `onDonationWrite` — recompute campaign/fund aggregates
- `materializeRecurringExpenses` — monthly + per-Jumuah (Hijri-aware)
- `hijriSeasonWatcher` — Ramadan/Eid campaigns, expected-zero Fridays
- `refreshPrayerTimes` — daily, Aladhan (Solsona)
- `recomputeAggregates` — dashboard counters

> `auditLog` is rule-enforced `write: if false` — only Cloud Functions write it.

## 7. Backups

Enable **Firestore → scheduled export** to a GCS bucket (daily). Confirm the
export runs and can be restored before handover.

## 8. Rules unit tests

Rules tests live in `tests/rules/` and require the Firestore emulator (Java):

```
# install firebase-tools + a JRE, then:
npm run test:rules
```

## 9. Playwright e2e

Remaining for the RTL acceptance checklist (§3.6): both month-grids and the
monthly-close flow, run in Arabic locale. `@playwright/test` is not yet wired.

## Open questions to resolve with the association

| ID | Question | Default |
|----|----------|---------|
| Q1 | الشرط cells after 20 Sep 2026: collected or pledged? | `--shart-mode collected`, quarantine post-20-Sep |
| Q6 | Member phone numbers for reminders | Phase-1 phone-collection campaign |
| Q9 | Opening balances (pass-through €524 unresolved) | set after Q9 answered |
| Q14 | School levels reset to المستوى الأول — correct? | imported as recorded, flagged |
