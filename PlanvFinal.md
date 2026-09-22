منصة مسجد النور — Masjid an-Nour Platform
Comprehensive Project Plan (v2.0 — the unified books)
Client: Comunitat Islàmica del Solsonès — الجمعية الاسلامية بصولصونيس
Sources of truth: school.xlsx (المدرسة) + Masjd.xlsx (دفتر الجمعية) + PLAN.md v1.1
Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS · Firebase Auth · Cloud Firestore
Firebase project: masjid-nour

0. What changed from v1.1
#	Change	Why
1	Masjd.xlsx added as a source of truth; the masjid tab is now specified from real data, not conjecture	The masjid keeps its own five-sheet book: dashboard, member pledges (الشرط), donations, expenses, Friday collections
2	New core architecture decision: one ledger, two books. Obligations (fees, pledges, salaries) vs. movements (payments, donations, expenses, transfers)	The association runs two parallel cash books (masjid: Jan–Dec; school: Oct–Jun) that share the same people and pass money between them — mostly invisibly
3	New collections: persons, members, pledgeMonths, funds, recurringExpenses, transfers, vendors; donations/payments/expenses extended	Grounded in the masjid workbook's actual structure
4	New modules: Members & الشرط grid, Friday-box tracker, Ramadan mode, recurring expenses, consolidated treasury	See §2 audit
5	School workbook re-audited — it has drifted since v1: 54 named students (was 51), 33 families (was 32), all students now recorded as المستوى الأول, outstanding fees €8,986	§3
6	v1's "fees due €7,672" corrected: the workbook states €8,986, and it is internally consistent — €9,693 billable − €707 collected	Arithmetic re-verified
7	Roadmap extended to ~10–12 weeks; Phase 2 now retires both workbooks	Masjid money is the treasurer's daily work
1. Executive summary
The association operates two Excel books that describe one community:

🕌 Masjd.xlsx — the mosque's calendar-year book (2026): 142 pledge members, a donations register, Friday collection box, and expenses. Arithmetically it is almost perfect: every stated total reconciles (income identity exact, expenses within €0.35). Its failures are semantic.
🏫 school.xlsx — the school's academic-year book (Oct 2025–Jun 2026): 33 families, 54 students, fee checkboxes, expenses. Arithmetically sloppy (a text-formatted €3.60 cell is silently dropped by Excel), but semantically clearer.
The 2026 picture as recorded:

Masjid (Jan–Dec)	School (Oct–Jun)
Income	€31,731 — pledges €11,315 · donations €14,666 · Friday box €5,750	€707 collected of €9,693 billable (7.3%)
Expenses	€6,720 (58 rows; row-sum €6,720.35)	€377.54 real + €1,231 transferred to the masjid
Balance	€25,011	−€699.54 on its own books
The platform replaces both with one role-based app, one identity system, one append-only ledger, surfaced as two tabs (المسجد / المدرسة) and one consolidated treasury. Money is stored in integer cents; every mutation is audit-logged; nothing is ever silently deleted.

Top findings (both books):

#	Finding	Where	Consequence
1	The pledge grid (الشرط) is filled through December while all cash books stop on 17–20 Sep 2026	Masjd	"Income €31,731" may include up to €1,625 (Oct–Dec) never collected — pledge vs. collection is indistinguishable in Excel
2	22 of 142 registered members never paid; the paying base falls €1,310 → €505/month	Masjd	No retention view exists; nobody can see churn
3	€1,231 transferred school → masjid (دهبت الى المسجد) appears in neither book correctly	both	Consolidated P&L is impossible; the transfer is an expense in one book and invisible income in the other
4	The school transferred €1,231 while recording only €707 of income all year	school	≥ €524 of pass-through cash (likely school-side Ramadan collections) never touched any book
5	77% of annual donations arrive in Ramadan; 90% including both Eids	Masjd	The fundraising year is one season; there is no seasonal tooling
6	Religious-personnel costs changed formula three times in nine months (€150/month → €100/week → €70/Friday); 38% of masjid spending	Masjid	Nothing documents the current commitment; nothing automates it
7	The Friday box depends purely on memory	Masjid	A missed Friday is undetectable
8	Donation register defects: one mis-dated row (2026/10/3), three undated rows, −€5 unreconciled, anonymous donors labeled "محسن"	Masjid
9	Every fee checkbox is FALSE while €707 was collected from 5 families in amounts that match no whole number of months	school	A boolean cannot express partial/irregular payment — the single strongest argument for the platform (v1 finding, still true)
10	€3.60 stored as text — Excel's SUM silently drops it	school	Stated €1,604.94 vs real €1,608.54
11	The same people appear in both books under different spellings	both	No household-level view of total giving exists
2. Audit — Masjd.xlsx (new in v2)
2.1 Sheet الرئيسية — dashboard
Metric	Stated	Independently verified	Verdict
الشرط (pledges)	€11,315	€11,315 — exact sum of the 12 monthly totals	✅ reconciles; semantics ambiguous (§2.2)
التبرعات (donations)	€14,666	€14,661 by row-sum (82 rows)	⚠️ −€5: one cell to verify at import
صدقات الجمعة	€5,750	€5,750 — exact	✅
إجمالي المداخيل	€31,731	11,315 + 14,666 + 5,750 = 31,731	✅ exact identity
إجمالي المصروفات	€6,720.0	€6,720.35 over 58 rows	✅ ±€0.35 (display rounding)
المتبقي	€25,011	31,731 − 6,720	✅
The masjid book balances. Its problems are what the numbers mean, not what they add up to.

2.2 Sheet الشرط — the member pledge register ⭐
The mosque's backbone: 142 registered members, one row each, twelve monthly columns (يناير → ديسمبر 2026), cell = amount contributed that month.

Verified structure:

Fact	Value
Registered members	142
Standard monthly pledge	€10 (≈96% of all value)
Exceptions	هشام بنساڭة €70 · يقيني امين €50 · منير الختري €25 (pays all 12 months) · ميلود بزيتون €20 · حماد البدوي €20 · بلحاج منصوري €15
Members who never paid a single month	22 (15.5%) — including الميلود قاسمي, عمر كروم, زريوح فاضمة, ibrima bayi…
Late starters	3 — ابوبكر بنعيسى (from Mar), حسن الشليح (from Jul), عزيز بنحدو (from Sep)
Paying in January	117 (111 × €10 + 6 exceptions = €1,310)
Paying in December	≈49 (48 × €10 + منير الختري €25 = €505)
Monthly totals	1310 · 1310 · 1240 · 1175 · 1135 · 1035 · 925 · 835 · 725 · 595 · 525 · 505 — monotone decline, every single month
Grid total	€11,315 ✅
The critical ambiguity: the cash books (donations, expenses, Friday box) all stop on 17–20 September 2026 — yet the pledge grid is filled through December for ~49 members. Either those cells are commitments rather than collections — in which case the dashboard's €31,731 "income" overstates cash by up to €1,625 (Oct–Dec) — or members genuinely prepay months ahead. The workbook cannot say which. The platform separates pledged from collected precisely so this question never has to be asked again.

Second critical gap: the register holds names only — no phone numbers, no contacts. Reminder/follow-up workflow is impossible today.

→ becomes members + pledgeMonths (§6), rendered by the same MonthGrid component as the school fee sheet — one UI pattern, two books.

2.3 Sheet التبرعات — donations ledger (€14,666)
82 rows, 17 Jan → 17 Sep 2026. Decomposed by group:

Group	Entries	Amount	Notes
Daily Ramadan collections	28	€6,479	€123–576/day, 17 Feb – 18 Mar (Ramadan 1447); includes €1,162 from three external communities: مسجد سان فروتوس €576, مسجد سان خوان منريسا €449, CARDONA €137
حملة رمضان lump	1	€4,750	Ramadan campaign, 17 Mar
Eid al-Fitr collections	4	€1,319	men €728 / women €265 + €212 + €114 — recorded separately by section
Eid al-Adha (27 May)	2	€658	men €594 / women €64
ت.المشروع (the project)	16	€750	Aug 9 – Sep 11, named donors — a capital campaign of undefined scope
الجثة (funeral collections)	17	€110	€5–15 entries tied to deaths in the community — a designated fund in all but name
Hucha (donation box)	2	€204	collected at the butcher's (الجزار): €96 + €108
Direct sadaqah	12	€391	incl. repeated donor name "محسن/محسنة" — the treasurer's label for anonymous cash
Total	82	€14,661	stated €14,666 → −€5 to reconcile at import
Seasonality — the headline number: Ramadan season (daily + campaign) = €11,229 = 76.5% of all donations; with Eid al-Fitr = €12,548 = 85.6%; with both Eids = €13,206 = 90.1%. The association's entire fundraising year is one Hijri season. The app needs a Ramadan mode, not just a donations table.

Data defects: one row dated 2026/10/3 sitting between 3/7 and 3/11 (clearly a March typo — importer proposes, human confirms); three undated الجثة rows; "كراء الاواني" €20 (utensil rental) booked as a donation — miscategorized income; no donor receipts anywhere; anonymous donors recorded under a pseudo-name.

→ becomes donations with channel, campaignId, fundId, donorType — see §6.

2.4 Sheet صدقات الجمعة — the Friday box (€5,750)
One row per Friday, 2 Jan → 18 Sep 2026 = 38 Fridays, total €5,750 exactly (avg €151, max €297 on 23 Jan). 20 March shows €0 with the note عيد الفطر — Eid al-Fitr fell on a Friday and there was no collection. The data is perfectly Hijri-consistent. Rows after 18 Sep are empty placeholders.

→ becomes donations with channel: "friday_box" + a Friday tracker UI: a calendar of expected Jumuah entries (auto-annotated from the Hijri calendar), amber gaps for missing Fridays, trend chart.

2.5 Sheet المصروفات — expenses (€6,720.35 / 58 rows)
Reconciliation: row-sum €6,720.35 vs displayed €6,720.00 — the book balances (unlike the school's). Rows are not chronologically sorted (2/24 and 2/18 rows sit after 3/3) — the importer must sort by date.

Category	Amount	Share	Contents
Religious personnel	€2,575	38%	مساعدة الفقيه €150 × 6 (Jan–Jun) · نومينا الفقيه 2025 back-pay €545 · paga de semana €100 × 4 (May–Jun) · خطيب الجمعة €70 × 10 + €30 (from 26 Jun)
اكرام رمضان (iftar)	€1,200	18%	single entry 29 Mar
Maintenance & supplies	€2,945	44%	gasoil €500 · extinguishers €279.40 · Karcher €290 · water €213.50 · dishes €356 · chairs €136 · granite cutting €30 · painting €54 · lights €46 · washroom/faucet €33 · microphone €21 · cleaning · small supplies
The personnel story (worth reading closely): the masjid's support for its religious staff changed formula three times in nine months — €150 monthly aid to the faqih (Jan–Jun, plus a €545 arrears payment for 2025) → €100 weekly "paga de semana" (late May–June, one row misspelled "para") → €70 per Friday khatib fee (from 26 June onward). Nothing in the book states the current commitment. → becomes recurringExpenses templates, materialized automatically per month / per Jumuah.

Vendor chaos (worse than the school's): grifell ×4 spellings · basar rong/bazar ×5 · ferreteria irca/la clau/plain/"rerretiria" (typo) · TRESPUNTS/3SPUNTS/LIBRERIA ×3 · plus OFISET, OBRAMAT, MERCADONA, KARCHER, ESPERADORA, BANCO BBV, PALET (water). ~58 rows → ~12 real vendors. → becomes vendors with autocomplete.

One €290 row (17 Mar) carries no note at all — same amount as the Karcher (7 May); flagged for review, not guessed.

2.6 Glossary (for the dev team)
Term	Meaning
الشرط	the members' monthly pledge register
الفقيه	the imam/religious teacher (receives monthly aid)
خطيب الجمعة	Friday preacher (per-Jumuah fee)
اكرام رمضان	Ramadan hospitality — iftar expenses
الجثة	funeral collections (small sums when a death occurs)
hucha (ES)	donation box — one sits at the butcher's (الجزار)
نومينا (nomina, ES)	payroll
paga de semana	weekly payment
محسن / محسنة	"benefactor" — anonymous-cash placeholder
ت.المشروع	donations to "the project" (undefined capital campaign)
2.7 Cross-book findings
a) The same community, two spellings. At least 13 school parents also sit in the pledge register:

School (العائلات والطلاب)	Masjid (الشرط)	Match type
محمد بوصحابة · عبد العالي بن الشيخ · حسن فرارشي · كمال الجطاري · يوسف فاتح · فيصل برتاتان · محمد حسون · حسن الشليح	same names (#19, #67, #66, #121, #134, #129, #110, #141)	exact
عبد القادرمداح	عبد القادر مداح (#32)	spacing
صالح محموح	صالح موحموح (#70)	doubling
عبد الحافظ المحاسني x	عبدالحفيظ المحاسني (#60)	حفظ/حفيظ
ميلود القسمي x	الميلود قاسمي (#81 — never paid)	article + spelling
عمركروم	عمر كروم (#97 — never paid)	spacing
Donor names in التبرعات also match members (عبد القادر مداح, بنعيسى حيدا, احمد الطهيري/الطاهري, "المكاوي" → ambiguous between two مكاوي members). Name matching must also handle Arabic↔Latin scripts (danva mamadi, SEYDI KAOUSSOU, SULAYMAN JATTA, CAMARA SAMSIDEEN). → the persons registry (§6), with proposals confirmed by humans, never auto-merged.

b) Invisible money. The school book records €1,231 "دهبت الى المسجد" while its own total income for the year is €707 — at least €524 of pass-through cash (school-side Ramadan collections, most likely) never entered any book, and the masjid's income register shows no matching receipt.

c) Two fiscal calendars. Masjid: Jan–Dec 2026. School: Oct 2025–Jun 2026. Reporting must support both windows plus Hijri seasons.

d) Household view. عبد العالي بن الشيخ pledges €10 × 12 months at the masjid while his €45/month school invoices show €0 collected. Neither book can answer "how much does this household give in total?" — a question the association will face when allocating fee support. The unified person view answers it (visible to finance roles only — see the dignity rule, §4).

3. Audit — school.xlsx: what changed since v1.1
The workbook has evolved since the v1 audit:

Metric	v1.1 audit	Current workbook
Students	52 stated / 51 named + 7 محجوز	55 stated / 54 named + 5 محجوز (59 rows) — the invoices sheet and the roster now agree on 54
Families	32 + 1 محجوز	33 unique (34 rows; يوسف فاتح still duplicated with two phones) + 1 محجوز row in invoices
Levels	الروض 9 · أول 17 · ثاني 17 · ثالث 13	all 54 recorded as المستوى الأول ← levels appear reset or overwritten; confirm (Q14)
English enrolment	نعم 5 · لا 45 · blank 8	14 children in 11 families (+€140/month); 6 blank flags
Fees outstanding	"€7,672" (v1 figure)	€8,986 = €9,693 billable (€1,077 × 9 months) − €707 collected — the dashboard is internally consistent on this metric
Expenses	€1,604.94 stated / €1,608.54 real	unchanged — the €3.60 text-cell bug persists
Transfers	€1,231 to the masjid	unchanged — and now known to be absent from the masjid's books (§2.7b)
Still true from v1: every fee checkbox FALSE with €707 hand-typed into 5 families' totals in non-whole-month amounts; the three fee-rule anomalies (سعيد جيحي and عمركروم charged €20 for 2 children; منعم البشيري €36 for 1); the x suffix on three parents; the empty teachers sheet; the pricing settings (20 / 18 / 15 / 10). New noise: a stray * inside مصطفى المغيتي's month columns.

→ The v1 school-side design carries over unchanged; §9.2 summarizes it.

4. Brand & design system (carried from v1, extended)
Brand assets, colors, typography, and the Islamic design philosophy are unchanged from PLAN.md v1.1 §3 — logo/wordmark, gold sun, 8-point star motif, skyline, gold hairline divider, the three pillars (fe · conocimiento · comunidad → الإيمان · العلم · المجتمع as the masjid-tab section headings), IBAN block ES63 2100 0081 9501 0176 0034 stored in settings/organization.

:root {
  --nour-green-900: #06291B;
  --nour-green-800: #0B3A26;
  --nour-green-700: #2C4536;
  --nour-gold-500:  #A69160;
  --nour-gold-600:  #977033;
  --nour-gold-300:  #D2CAAF;
  --nour-cream-50:  #F6F5F2;
  --nour-stone-400: #A6A99D;
  --success: #2F7D53;
  --warning: #B8860B;
  --danger: #8C2F2F;
}
Rules that gain new weight in v2:

Amanah (الأمانة) in money handling — now applies to the masjid books too: every euro of pledges, donations, Friday collections, and expenses traces to an append-only document with author and timestamp.
Dignity of the giver and payer — extended from families to members: pledge arrears, never-paid status, and combined household giving are visible only to admin/treasurer; no ranking, no red floods.
Hijri alongside Gregorian everywhere — the masjid data proves the community already lives by the Hijri calendar (Eid-Friday zero, Ramadan window, Eid al-Adha on 27 May 2026 all reconcile perfectly).
RTL-first (ar default), es/ca mirrored; gold as accent, never background; no figurative imagery; calm and restraint.
5. Roles & permissions
Unchanged from v1: admin (مدير) · treasurer (أمين الصندوق — now covers both books) · teacher (معلم) · parent (ولي أمر) · viewer (مطلع).

v2 additions:

Members are records, not users. The pledge register has no contact data, so no member login in v1 — but the persons registry links a member to a parent account when they are the same person, so a parent logging in can eventually see their pledge history too.
Auth strategy unchanged: staff email+password; parents phone+SMS OTP (seeded from the school sheet's E.164-normalized numbers). A membership-secretary role (أمين الشرط) can be added later without schema changes.
6. Data model (Firestore) — v2
Design principle: obligations vs. movements. An obligation is what someone should pay (school invoice, pledge month, salary month). A movement is money that actually moved (payment, donation, expense, transfer). Dashboards compute both; nothing is typed in by hand. All money is integer cents.

```
persons/{personId}                                  ← NEW v2: community directory
  canonicalName, aliases: [{text, source}], phone?, email?,
  links: { familyId?, memberId?, teacherId? },
  matchConfidence: "confirmed"|"proposed", needsReview, notes
members/{memberId}                                  ← NEW v2: الشرط register
  personId?, fullName, monthlyPledgeCents,           // standard amount (default 1000)
  startMonth: "2026-01", endMonth?,
  status: "active"|"lapsed"|"never_paid"|"left",     // derived, not typed
  notes, isActive
pledgeMonths/{id}                                   ← NEW v2: grid cell = member × month
  memberId, month: "2026-01",
  expectedCents, paidCents,
  status: "unpaid"|"partial"|"paid"|"waived", notes
invoices/{invoiceId}                                // school: family × academic month (v1)
  familyId, academicYearId, month, arabicChildren, arabicFeeCents,
  englishChildren, englishFeeCents, totalCents, paidCents,
  status, isManualOverride, dueDate, notes
payments/{paymentId}                                // append-only, EXTENDED
  scope: "school"|"masjid",
  against: { type: "invoice"|"pledgeMonth", id },
  familyId?|memberId?, amountCents, paidAt,
  method: "cash"|"transfer"|"bizum", receivedByUid, reference?, receiptUrl?
donations/{donationId}                              // EXTENDED
  date, amountCents, method,
  channel: "friday_box"|"ramadan_daily"|"eid_men"|"eid_women"|"hucha"
          |"direct"|"external"|"campaign"|"fund",
  donorType: "individual"|"anonymous"|"organization"|"mosque"|"box",
  donorName?,                 // labelOnReceipt when anonymous (replaces "محسن")
  personId?, campaignId?, fundId?, receiptIssued, hijriLabel?, notes
funds/{fundId}                                      ← NEW v2 (e.g. funeral fund / الجثة)
  name, purpose, policy, isActive   // balance derived from donations − disbursements
campaigns/{campaignId}                              // EXTENDED
  type: "ramadan"|"eid_fitr"|"eid_adha"|"project"|"general", hijriYear?,
  title, description, targetCents?, raisedCents (derived), start, end, isActive
recurringExpenses/{id}                              ← NEW v2
  label, payee?, amountCents,
  frequency: "monthly"|"weekly"|"per_jumuah", anchor,
  activeFrom, activeTo?, category, autoCreate, notes
vendors/{vendorId}                                  ← NEW v2
  name, aliases[], defaultCategory?
expenses/{expenseId}                                // EXTENDED
  scope: "school"|"masjid", date, description, amountCents,
  category: "imam_support"|"khatib_fees"|"salaries"|"iftar_ramadan"|"utilities"
          |"maintenance"|"supplies"|"cleaning"|"equipment"|"bank_fees"
          |"events"|"charity"|"transfer"|"other",
  vendorId?, recurringId?, fundId?, observation, createdByUid, attachmentUrl?
transfers/{id}                                      ← NEW v2: school ⇄ masjid, counted once
  fromScope, toScope, amountCents, date, reference?, createdByUid, notes
  // appears as expense in the sender's book, income in the receiver's,
  // and is ELIMINATED in the consolidated P&L
families, students, classes, teachers, salaryPayments,
grades, attendance, events, prayerTimes, announcements, auditLog      // unchanged from v1
settings/organization                               // EXTENDED
  iban, titular, concepto, fiscalYear (Jan–Dec), openingBalances { masjid, school }
```

Composite indexes (additions): pledgeMonths: memberId ASC, month ASC · pledgeMonths: month ASC, status ASC · donations: channel ASC, date DESC · donations: campaignId ASC, date DESC · donations: fundId ASC, date DESC · expenses: vendorId ASC, date DESC — plus the v1 set.

7. Firestore security rules (v2)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function auth_()    { return request.auth != null; }
    function role()     { return request.auth.token.role; }
    function isAdmin()  { return auth_() && role() == 'admin'; }
    function isFinance(){ return auth_() && role() in ['admin','treasurer']; }
    function isStaff()  { return auth_() && role() in ['admin','treasurer','teacher']; }
    function myFamily() { return request.auth.token.familyId; }

    match /users/{uid} {
      allow read:  if auth_() && (request.auth.uid == uid || isAdmin());
      allow write: if isAdmin();
    }

    // community directory
    match /persons/{id}   { allow read: if isStaff();  allow write: if isAdmin(); }

    // masjid pledges — finance only (dignity of members)
    match /members/{id}       { allow read: if isStaff();   allow write: if isFinance(); }
    match /pledgeMonths/{id}  { allow read: if isFinance(); allow write: if isFinance(); }

    match /families/{id} {
      allow read:  if isStaff() || (auth_() && myFamily() == id);
      allow write: if isAdmin();
    }
    match /students/{id} {
      allow read:  if isStaff() || (auth_() && resource.data.familyId == myFamily());
      allow write: if isAdmin();
    }
    match /invoices/{id} {
      allow read:  if isFinance() || (auth_() && resource.data.familyId == myFamily());
      allow write: if isFinance();
    }
    match /payments/{id} {
      // v2.0.1 fix: earlier draft contained a corrupted expression (`id / 0`).
      // Implemented as family-claim equality: finance always; parents only their own.
      allow read:   if isFinance() || (auth_() && request.auth.token.familyId == resource.data.familyId);
      allow create: if isFinance();
      allow update, delete: if false;      // append-only; corrections = new doc
    }
    match /donations/{id}      { allow read: if isFinance(); allow write: if isFinance(); }
    match /funds/{id}          { allow read: if isStaff();   allow write: if isFinance(); }
    match /campaigns/{id}      { allow read: if auth_();     allow write: if isFinance(); }
    match /recurringExpenses/{id} { allow read: if isStaff(); allow write: if isFinance(); }
    match /vendors/{id}        { allow read: if isStaff();   allow write: if isFinance(); }
    match /transfers/{id}      { allow read: if isFinance(); allow create: if isFinance();
                                 allow update, delete: if false; }
    match /grades/{id} {
      allow read:  if isStaff() || (auth_() && resource.data.familyId == myFamily());
      allow write: if isStaff();
    }
    match /expenses/{id}  { allow read: if isStaff();   allow write: if isFinance(); }
    match /teachers/{id}  { allow read: if isStaff();   allow write: if isAdmin(); }
    match /salaryPayments/{id} { allow read: if isFinance(); allow write: if isFinance(); }
    match /events/{id}        { allow read: if auth_();  allow write: if isStaff(); }
    match /announcements/{id} { allow read: if auth_();  allow write: if isStaff(); }
    match /prayerTimes/{id}   { allow read: if true;     allow write: if false; }
    match /auditLog/{id}      { allow read: if isAdmin(); allow write: if false; }

    match /{document=**} { allow read, write: if false; }
  }
}
```

Operational security notes from v1 still apply: rotate/restrict the web API key, enable App Check, custom claims as the real boundary, config in NEXT_PUBLIC_FIREBASE_* env vars, getAnalytics() guarded by isSupported() — never allow read, write: if true.

8. Application structure
```
src/app/[locale]/                    # ar (default, RTL) | es | ca
  (auth)/login
  (app)/
    page.tsx                         # unified dashboard
    masjid/
      members/page.tsx               # ⭐ الشرط month-grid
      members/[id]/page.tsx
      donations/page.tsx
      donations/friday/page.tsx      # Friday-box tracker
      funds/page.tsx
      campaigns/page.tsx
      expenses/page.tsx
      recurring/page.tsx
      treasury/page.tsx              # consolidated books
      prayer-times/ · announcements/
    school/
      families/ · students/ · classes/ · teachers/ · grades/
      attendance/ · invoices/        # ⭐ same MonthGrid component
      expenses/ · calendar/
    settings/ (pricing · users · academic-year · organization)

src/components/patterns/MonthGrid    # ONE component, two books (invoices + pledges)
src/components/patterns/PersonLink   # person 360 chips
src/lib/fees.ts · money.ts · hijri.ts · matching/persons.ts (fuzzy matcher)
```

9. Feature specification
9.1 Unified dashboard
KPIs computed live, both books: students · families · members (active/lapsed/never) · school collection rate (€707/€9,693) · pledge expected vs. collected · donations YTD · Friday box YTD · expenses by scope · treasury balance. Payer-retention trend (117 → 49), donation seasonality chart with Ramadan shading, revenue vs. expense by month, transfer summary, next 5 events.

9.2 School tab (carried from v1 §8.2–8.8 — unchanged)
Families & students (search, WhatsApp links, reserved seats), classes, gradebook + Qur'an memorization + report-card PDF, teachers & salary month-grid, fees & invoicing month-grid (partial payments, filters, bulk generate, receipts), expenses, calendar. All financial modules write to the shared ledger.

9.3 Masjid tab (new in v2 — specified from real data)
9.3.1 Members & الشرط ⭐ core module

The month-grid, one-for-one replacing sheet الشرط: members as rows, يناير→ديسمبر as columns; each cell is a pledgeMonth with expected/paid/status — not a blank.
Click a cell → record payment → append-only payments doc → paidCents/status recomputed in a transaction.
Statuses are derived: active = paid within the last 2 recorded months; never_paid; lapsed; left.
Retention analytics: paying-members trend line, monthly churn list, never-payer list (22 today), expected-vs-collected gap — the numbers no Excel view can show.
Export the grid back to Excel in the exact sheet الشرط shape.
Reminder queue (WhatsApp/SMS) — blocked on contact data (Q6); Phase 1 includes a phone-collection campaign.
9.3.2 Donations ledger

Quick-entry forms per channel: Friday box (one tap, date pre-filled to the current Jumuah), Ramadan daily (keypad-fast during tarawih season), Eid men's/women's split sheets, hucha collection (location note), direct sadaqah, external/organization donors.
donorType: anonymous with labelOnReceipt — replaces the "محسن" pseudo-name.
Campaign & fund linkage; printable جزاكم الله خيرا receipt with association letterhead and IBAN (optional per donor).
Seasonality view: monthly bars, Ramadan/Eid annotated via Hijri calendar.
9.3.3 Friday-box tracker

Calendar of Fridays; an entry is expected every Jumuah; a missing Friday renders as an amber gap; Eid Fridays auto-annotated (the imported 20 Mar 2026 €0 keeps its hijriLabel: عيد الفطر).
Stats: average (€151), peak (€297), YTD total, trend.
9.3.4 Funds — the funeral fund (الجثة) gets a real identity: balance = donations − disbursements, policy text, admin visibility only.

9.3.5 Campaigns & Ramadan mode

Campaign templates: رمضان (auto-created yearly from the Hijri calendar: daily collections + lump + Eid splits), العيدان, المشروع.
During Ramadan the masjid dashboard switches to a seasonal view: fast daily-collection entry, running total vs. the 1447 baseline (€11,229), iftar expense quick-entry, progress toward target.
9.3.6 Recurring expenses

Templates mirror reality: خطيب الجمعة €70 per Jumuah (active since 26 Jun 2026), مساعدة الفقيه €150 monthly (historical, Jan–Jun 2026), periodic cleaning.
A Cloud Function materializes due entries (monthly and per-Jumuah); the treasurer confirms or edits; the 2026 formula changes remain as documented history.
9.3.7 Treasury (consolidated)

One P&L across both books with transfers eliminated; per-scope views (masjid fiscal year Jan–Dec, school academic year Oct–Jun); cash & bank position from opening balances; monthly closing checklist (generate obligations → record movements → reconcile → export); reserve visibility (€25k accumulated — presumably for المشروع).
9.3.8 Public donation page (from v1): the banner reproduced — IBAN, titular, concepto DONACIÓN, three pillars, جزاكم الله خيرا, copy-to-clipboard, printable A4/QR version.

9.4 Cross-cutting
Person 360: one page per community member — pledge history, donations, school children, invoices (finance roles only).
Reporting periods: fiscal year / academic year / Hijri season.
Arabic · Spanish · Catalan, RTL-first; dark mode (deep green); global search (⌘K) across persons, families, students, members, classes; Excel/PDF export of any table; audit log on every financial mutation; offline-tolerant reads; responsive with mobile card layouts for both month-grids.
10. Technical stack & Cloud Functions
Stack unchanged from v1 §9 (Next.js 15 · Tailwind v4 + tokens · shadcn/ui · Firebase Auth/Store/Storage · TanStack Query + Table · Recharts · date-fns + @umalqura/core · SheetJS · Vitest/Playwright + rules tests · Vercel).

Cloud Functions (updated):

onUserCreate → default role + users/{uid} mirror.
setUserRole (admin-only callable) → custom claims.
generateMonthlyObligations (scheduled, 1st of month) → school invoices + masjid pledgeMonths using the pricing/pledge engines.
generateSalaryPayments → pending salary rows.
materializeRecurringExpenses (monthly + per-Jumuah via Hijri-aware cron) → due khatib/faqih/cleaning entries.
onPaymentWrite → recompute invoice/pledgeMonth status + auditLog.
onDonationWrite → recompute campaign/fund aggregates.
hijriSeasonWatcher → detect Ramadan/Eid; create seasonal campaigns; flag expected-zero Fridays.
refreshPrayerTimes (daily, Aladhan, Solsona) → cached in Firestore.
recomputeAggregates → dashboard counters and treasury roll-ups.
11. Migration — both workbooks
One script, scripts/import-excel.ts, run against the Admin SDK. Dry run first → migration-report.json; every doc carries importedFrom + importedAt; everything reversible.

Import order: persons → masjid → school → links → transfers → reconciliation.

A. Masjd.xlsx

الشرط → 142 members. monthlyPledgeCents from the modal amount (€1,000), exceptions preserved; startMonth/endMonth from first/last paid cell; 22 → never_paid. --shart-mode collected|pledged flag (default collected, pending Q1): cells dated after the last cash-book entry (20 Sep 2026) are quarantined to a review list under either mode. Cells → pledgeMonths + opening payments; total must equal €11,315.
التبرعات → 82 donations with channel mapping: Ramadan-window rows → campaign رمضان 1447 (external-mosque notes → donorType: mosque); حملة رمضان €4,750 → same campaign; العيد رجال/النساء → eid_fitr campaign, channels eid_men/eid_women; عيد الأضحى rows → eid_adha campaign; الجثة → fund funeral; HUCHA → channel hucha (note الجزار); ت.المشروع → campaign المشروع; محسن/محسنة → donorType: anonymous + labelOnReceipt. Row-sum target €14,661 vs stated €14,666 → €5 variance requires sign-off. The 2026/10/3 date → proposed correction to March (human confirms); three undated rows → date: null, needsReview.
صدقات الجمعة → 38 donations channel: friday_box (incl. the Eid €0 with hijriLabel); total €5,750 exact. Future placeholder rows ignored.
المصروفات → 58 expenses, sorted by date; category inference from notes (rules table); vendor normalization (grifell, Bazar Rong, Ferreteria IRCA/LA CLAU, Mercadona, Trespunts, OFISET, OBRAMAT, KARCHER, ESPERADORA, BBVA, PALET); the note-less €290 → other + needsReview; "para de semana" → typo of paga. Target €6,720.35 (€0.35 display variance noted).
Recurring templates: خطيب €70/Jumuah (active), مساعدة الفقيه €150/month (historical).
B. school.xlsx — per v1 §10, updated numbers: 33 families (+1 reserved slot) · 54 students + 5 reserved · 297 invoices (33 × 9) totaling €9,693 billable · five opening payments = €707 with note "opening balance migrated — month allocation unknown" · 16 real expenses (€377.54, with the text-formatted €3.60 recovered) · pricing settings (20/18/15/10) · the three fee anomalies imported as isManualOverride: true · يوسف فاتح duplicate and x suffixes to the review list · levels imported as recorded (all المستوى الأول — flagged, Q14).

C. Persons pass — propose the ≥13 known matches (§2.7) plus donor↔member links; humans confirm; fuzzy matcher handles Arabic↔Latin scripts and spelling variants; never auto-merge.

D. Transfers — the two دهبت الى المسجد rows become transfers (school → masjid, €921 + €310). Masjid-side: no matching income exists → surfaced in the report as the pass-through finding; opening balances set only after Q9 is answered.

Post-import reconciliation targets:

Collection	Docs	Value
members	142 (120 ever-paid · 22 never)	€11,315 pledged/collected
pledgeMonths + payments	≈1,100 cells	€11,315
donations (masjid)	82	€14,661 (−€5 sign-off)
campaigns	4 (رمضان 1447 €11,229 · عيد الفطر €1,319 · عيد الأضحى €658 · المشروع €750)	—
funds	1 (funeral, €110)	—
Friday entries	38	€5,750
masjid expenses	58	€6,720.35
school invoices	297	€9,693 billable
school opening payments	5	€707
school expenses	16 + 2 transfers	€377.54 + €1,231
persons links	≥13 proposed	—
12. Delivery roadmap
Phase	Scope	Est.
0 — Foundation	Repo, brand tokens, RTL shell, Firebase, Auth + roles/claims, rules v2 + emulator tests	1 wk
1 — Community directory	persons, families, students, members, teachers, classes, settings; both Excel importers + migration report	1.5 wk
2 — Money ⭐⭐	Shared MonthGrid → school invoices + masjid pledges; payments; donations with channels/campaigns/funds; Friday tracker; expenses + vendors + recurring; transfers; treasury	3 wk
3 — Academics	Gradebook, Qur'an memorization, attendance, report-card PDF	1.5 wk
4 — Calendar & community	Events, prayer times, announcements, Ramadan mode, public donation page	1.5 wk
5 — Polish	Dashboards, exports, i18n es/ca, dark mode, mobile grids, audit UI	1 wk
6 — Hardening & handover	App Check, key restriction, backups, rules coverage, Arabic manual, staff training	1 wk
≈ 11 weeks solo. Phases 0–2 retire both workbooks.

13. Definition of done
 No screen requires knowing English or Spanish to operate.
 Every euro on screen traces to an append-only document with an author and a timestamp — in both books.
 Both workbooks re-import into a blank project and reproduce: €31,731 / €6,720.35 / €5,750 / €11,315 / €9,693 / €707 / €1,231 — with the €5 and €0.35 variances surfaced as sign-offs, and the school's €3.60 text bug corrected on import.
 The pledge grid shows expected vs. collected; the retention trend and never-payer list are live.
 A missing Friday renders as a visible gap; Eid Fridays are Hijri-aware.
 Transfers appear exactly once in each book and are eliminated from the consolidated P&L.
 The treasurer can close a month for both books — generate, collect, reconcile, export — without leaving the app.
 Security rules have unit tests; a parent cannot read another family's invoice; a teacher cannot read pledge data; no allow read, write: if true anywhere.
 Lighthouse ≥ 90 on mobile for dashboard and both month-grids; daily automated Firestore export.
