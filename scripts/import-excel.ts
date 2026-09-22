/**
 * Excel importer — one script for both workbooks (plan §11).
 *
 * Default is --dry-run: parses Masjd.xlsx + school.xlsx and emits
 * migration-report.json with reconciliation totals, needsReview flags, and
 * proposed person matches. Nothing is written to Firestore in dry-run mode.
 *
 * Usage:
 *   npx tsx scripts/import-excel.ts                 # dry run (default)
 *   npx tsx scripts/import-excel.ts --shart-mode pledged
 */
import { readWorkbook, readRows, serialToISO, toInt, toMoneyCents, cleanArabic, type Row } from "../src/lib/excel";
import { matchNames } from "../src/lib/matching";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  Cents,
  Donation,
  Expense,
  Family,
  Invoice,
  Member,
  PledgeMonth,
  Student,
  Transfer,
} from "../src/lib/schema";

const ROOT = resolve(__dirname, "..");

const args = process.argv.slice(2);
const SHART_MODE: "collected" | "pledged" = args.includes("--shart-mode=pledged") ? "pledged" : "collected";
const DRY_RUN = !args.includes("--write");

const MASJID_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const MASJID_MONTH_KEYS = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"];
const SCHOOL_MONTH_KEYS = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];
const CASH_BOOK_END = "2026-09";

function findHeader(rows: Row[], required: string[]): { index: number; cols: Record<string, number> } {
  for (let i = 0; i < rows.length; i++) {
    const cols: Record<string, number> = {};
    rows[i].forEach((cell, ci) => {
      const key = cleanArabic(cell);
      if (key && !(key in cols)) cols[key] = ci;
    });
    if (required.every((r) => r in cols)) return { index: i, cols };
  }
  throw new Error(`Header not found (required: ${required.join(", ")})`);
}

function modal(values: number[]): number {
  const freq = new Map<number, number>();
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1);
  let best = 10;
  let bestCount = -1;
  for (const [v, c] of freq) if (c > bestCount) { best = v; bestCount = c; }
  return best;
}

// --- Person matching state -------------------------------------------------
const memberNames: string[] = [];
const personsMatches: { a: string; b: string; confidence: "exact" | "proposed" }[] = [];

function proposePersonMatches(schoolParents: string[]) {
  for (const parent of schoolParents) {
    for (const member of memberNames) {
      const m = matchNames(parent, member);
      if (m) personsMatches.push({ a: parent, b: member, confidence: m.confidence });
    }
  }
}

// --- School ----------------------------------------------------------------
function parseSchool() {
  const wb = readWorkbook(resolve(ROOT, "school.xlsx"));

  const settingsRows = readRows(wb.Sheets["الإعدادات"]);
  const pricing = {
    oneChild: toMoneyCents(settingsRows[1]?.[1]) ?? 2000,
    twoChildren: toMoneyCents(settingsRows[2]?.[1]) ?? 1800,
    threePlusChildren: toMoneyCents(settingsRows[3]?.[1]) ?? 1500,
    englishPerChild: toMoneyCents(settingsRows[4]?.[1]) ?? 1000,
  };

  const famRows = readRows(wb.Sheets["العائلات والطلاب"]);
  const { index: famHeaderIdx, cols: famCols } = findHeader(famRows, ["اسم ولي الأمر الكامل", "اسم الطالب"]);
  const families = new Map<string, Family>();
  const phonesByFamily = new Map<string, Set<string>>();
  const students: Student[] = [];
  const reservedStudents: Student[] = [];
  const duplicatePhones: { name: string; phones: string[] }[] = [];
  const xSuffixNames: string[] = [];

  for (let i = famHeaderIdx + 1; i < famRows.length; i++) {
    const r = famRows[i];
    const parentA = cleanArabic(r[famCols["اسم ولي الأمر الكامل"]]);
    const parentE = cleanArabic(r[famCols["اختر ولي الأمر"]]);
    const studentName = cleanArabic(r[famCols["اسم الطالب"]]);
    const phone = String(r[famCols["رقم الهاتف"]] ?? "").trim();
    const email = cleanArabic(r[famCols["البريد الإلكتروني"]]);
    const level = cleanArabic(r[famCols["المستوى الدراسي"]]);
    const english = cleanArabic(r[famCols["مسجل بالإنجليزية؟"]]) === "نعم";

    const parentName = parentA || parentE;
    if (!parentName && !studentName) continue;

    const isReservedSeat = parentE === "محجوز" || parentName === "محجوز";
    const realParent = parentA && parentA !== "محجوز" ? parentA : parentE && parentE !== "محجوز" ? parentE : null;

    let familyId = "family-reserved";
    if (realParent) {
      if (!families.has(realParent)) {
        families.set(realParent, { id: `family-${families.size + 1}`, parentName: realParent, phone: phone || undefined, email: email || undefined, notes: "" });
        phonesByFamily.set(realParent, new Set());
      }
      const fam = families.get(realParent)!;
      if (phone) phonesByFamily.get(realParent)!.add(phone);
      const phones = [...phonesByFamily.get(realParent)!];
      if (phones.length > 1 && !duplicatePhones.some((d) => d.name === realParent)) {
        duplicatePhones.push({ name: realParent, phones });
      }
      familyId = fam.id;
      if (/\s?x$/i.test(realParent) && !xSuffixNames.includes(realParent)) {
        xSuffixNames.push(realParent);
      }
    }

    if (isReservedSeat) {
      reservedStudents.push({ id: `student-reserved-${reservedStudents.length + 1}`, familyId, name: studentName || "محجوز", level, englishEnrolled: english, reserved: true });
      continue;
    }

    if (studentName) {
      students.push({ id: `student-${students.length + 1}`, familyId, name: studentName, level, englishEnrolled: english });
    }
  }

  const familyList = [...families.values()];
  const familyByName = new Map(familyList.map((f) => [f.parentName, f.id]));

  const invRows = readRows(wb.Sheets["الفواتير والرسوم"]);
  const { index: invHeaderIdx, cols: invCols } = findHeader(invRows, ["اسم ولي الأمر", "الإجمالي (€)"]);
  const invoices: Invoice[] = [];
  const openingPayments: { familyId: string; amountCents: Cents }[] = [];
  let billableTotal = 0;
  let collectedTotal = 0;

  for (let i = invHeaderIdx + 1; i < invRows.length; i++) {
    const r = invRows[i];
    const name = cleanArabic(r[invCols["اسم ولي الأمر"]]);
    if (!name || /محجوز/.test(name)) continue;
    const totalCents = toMoneyCents(r[invCols["الإجمالي (€)"]]) ?? 0;
    const collectedCents = toMoneyCents(r[invCols["المجموع"]]) ?? 0;
    const familyId = familyByName.get(name) ?? `family-unmatched-${name}`;

    for (const month of SCHOOL_MONTH_KEYS) {
      invoices.push({
        id: `invoice-${name}-${month}`,
        familyId,
        academicYearId: "2025-2026",
        month,
        arabicChildren: toInt(r[invCols["عدد الأطفال (عربية)"]]) ?? 0,
        arabicFeeCents: toMoneyCents(r[invCols["رسوم العربية (€)"]]) ?? 0,
        englishChildren: toInt(r[invCols["عدد الأطفال (إنجليزية)"]]) ?? 0,
        englishFeeCents: toMoneyCents(r[invCols["رسوم الإنجليزية (€)"]]) ?? 0,
        totalCents,
        paidCents: 0,
        status: "unpaid",
        isManualOverride: false,
        notes: "",
      });
    }
    billableTotal += totalCents * SCHOOL_MONTH_KEYS.length;
    if (collectedCents > 0) {
      openingPayments.push({ familyId, amountCents: collectedCents });
      collectedTotal += collectedCents;
    }
  }

  const expRows = readRows(wb.Sheets["المصاريف"]);
  const { index: expHeaderIdx, cols: expCols } = findHeader(expRows, ["تاريخ الصرف", "بيان المصروف"]);
  const expenses: Expense[] = [];
  const transfers: Transfer[] = [];

  for (let i = expHeaderIdx + 1; i < expRows.length; i++) {
    const r = expRows[i];
    const serial = r[expCols["تاريخ الصرف"]];
    const description = cleanArabic(r[expCols["بيان المصروف"]]);
    const amount = toMoneyCents(r[expCols["المبلغ (€)"]]) ?? 0;
    const notes = cleanArabic(r[expCols["ملاحظات"]]);
    if (!description && amount === 0) continue;
    const date = typeof serial === "number" ? serialToISO(serial) : "";

    if (/المسجد|دهبت/.test(description)) {
      transfers.push({ id: `transfer-${transfers.length + 1}`, fromScope: "school", toScope: "masjid", amountCents: amount, date, notes, createdByUid: "import" });
    } else {
      expenses.push({ id: `expense-school-${expenses.length + 1}`, scope: "school", date, description, amountCents: amount, category: "other", observation: notes, createdByUid: "import" });
    }
  }

  return { pricing, familyList, students, reservedStudents, invoices, openingPayments, billableTotal, collectedTotal, expenses, transfers, duplicatePhones, xSuffixNames };
}

// --- Masjid -----------------------------------------------------------------
function parseMasjid() {
  const wb = readWorkbook(resolve(ROOT, "Masjd.xlsx"));

  const shartRows = readRows(wb.Sheets["الشرط"]);
  const { index: shartHeaderIdx, cols: shartCols } = findHeader(shartRows, ["الإسم", "يناير"]);
  const members: Member[] = [];
  const pledgeMonths: PledgeMonth[] = [];
  const neverPaid: string[] = [];
  const quarantineCells: { member: string; month: string; cents: Cents }[] = [];

  for (let i = shartHeaderIdx + 1; i < shartRows.length; i++) {
    const r = shartRows[i];
    const name = cleanArabic(r[shartCols["الإسم"]]);
    if (!name) continue;
    memberNames.push(name);

    const cellEuros = MASJID_MONTHS.map((m) => toInt(r[shartCols[m]])); // euros | null
    const paidEuros = cellEuros.filter((c): c is number => c !== null && c > 0);
    const monthlyPledgeCents = (paidEuros.length ? modal(paidEuros) : 10) * 100;
    const firstIdx = cellEuros.findIndex((c) => c !== null && c > 0);
    const lastIdx = cellEuros.reduce((acc: number, c, idx) => (c !== null && c > 0 ? idx : acc), -1);

    const member: Member = {
      id: `member-${members.length + 1}`,
      fullName: name,
      monthlyPledgeCents,
      startMonth: firstIdx >= 0 ? MASJID_MONTH_KEYS[firstIdx] : "2026-01",
      endMonth: lastIdx >= 0 ? MASJID_MONTH_KEYS[lastIdx] : undefined,
      status: paidEuros.length === 0 ? "never_paid" : "active",
      notes: "",
      isActive: true,
    };
    members.push(member);
    if (paidEuros.length === 0) neverPaid.push(name);

    cellEuros.forEach((euro, idx) => {
      if (euro === null) return;
      const month = MASJID_MONTH_KEYS[idx];
      const cents = euro * 100;
      pledgeMonths.push({
        id: `pm-${name}-${month}`,
        memberId: member.id,
        month,
        expectedCents: monthlyPledgeCents,
        paidCents: SHART_MODE === "collected" ? cents : 0,
        status: SHART_MODE === "collected" ? (cents >= monthlyPledgeCents ? "paid" : "partial") : "unpaid",
        notes: "",
      });
      if (month > CASH_BOOK_END) quarantineCells.push({ member: name, month, cents });
    });
  }

  // التبرعات — donations ledger
  const donations: Donation[] = [];
  const donationIssues: { type: string; detail: string }[] = [];
  const donRows = readRows(wb.Sheets["التبرعات"]);
  const { index: donHeaderIdx, cols: donCols } = findHeader(donRows, ["التاريخ", "الإسم", "المبلغ"]);
  let donationsSum = 0;
  const campaignBuckets = { ramadan: 0, eid_fitr: 0, eid_adha: 0, project: 0, funeral: 0 };

  for (let i = donHeaderIdx + 1; i < donRows.length; i++) {
    const r = donRows[i];
    const serial = r[donCols["التاريخ"]];
    const name = cleanArabic(r[donCols["الإسم"]]);
    const amount = toMoneyCents(r[donCols["المبلغ"]]) ?? 0;
    const notes = cleanArabic(r[donCols["ملاحظات"]]);
    if (!name && amount === 0) continue;

    const date = typeof serial === "number" ? serialToISO(serial) : "";
    if (!date) donationIssues.push({ type: "undated-donation", detail: `${name || "?"} €${amount / 100}` });
    if (date === "2026-10-03") donationIssues.push({ type: "misdated-donation", detail: `${name} €${amount / 100} (2026/10/3 → March?)` });

    const c = classifyDonation(date, name, notes);
    donationsSum += amount;
    if (c.campaign === "ramadan") campaignBuckets.ramadan += amount;
    else if (c.campaign === "eid_fitr") campaignBuckets.eid_fitr += amount;
    else if (c.campaign === "eid_adha") campaignBuckets.eid_adha += amount;
    else if (c.campaign === "project") campaignBuckets.project += amount;
    if (c.fund === "funeral") campaignBuckets.funeral += amount;

    donations.push({
      id: `donation-${donations.length + 1}`,
      date,
      amountCents: amount,
      method: "cash",
      channel: c.channel,
      donorType: c.donorType,
      donorName: c.anonymous ? name : undefined,
      campaignId: c.campaign,
      fundId: c.fund,
      receiptIssued: false,
      notes,
      needsReview: !date || c.needsReview,
    });
  }

  // حملة رمضان 2026 — donor breakdown of the €4,750 lump (already in التبرعات).
  const ramRows = readRows(wb.Sheets["حملة رمضان 2026"]);
  const campaignDonors: { name: string; amountCents: Cents }[] = [];
  let campaignLump = 0;
  for (let i = 2; i < ramRows.length; i++) {
    const r = ramRows[i];
    const name = cleanArabic(r[1]);
    const amount = toMoneyCents(r[2]) ?? 0;
    if (!name && amount === 0) continue;
    campaignDonors.push({ name, amountCents: amount });
    campaignLump += amount;
  }
  campaignBuckets.ramadan += campaignLump;

  // صدقات يوم الجمعة — Friday box (skip future placeholder rows).
  const friRows = readRows(wb.Sheets["صدقات يوم الجمعة"]);
  const { index: friHeaderIdx, cols: friCols } = findHeader(friRows, ["التاريخ", "المبلغ"]);
  let fridayTotal = 0;
  let fridayCount = 0;
  for (let i = friHeaderIdx + 1; i < friRows.length; i++) {
    const r = friRows[i];
    const serial = r[friCols["التاريخ"]];
    const amount = toMoneyCents(r[friCols["المبلغ"]]) ?? 0;
    const notes = cleanArabic(r[friCols["ملاحظات"]]);
    if (typeof serial !== "number") continue;
    if (amount === 0 && !/عيد|فطر/.test(notes)) continue; // future placeholder
    fridayTotal += amount;
    fridayCount++;
    donations.push({
      id: `donation-friday-${donations.length + 1}`,
      date: serialToISO(serial),
      amountCents: amount,
      method: "cash",
      channel: "friday_box",
      donorType: "box",
      receiptIssued: false,
      hijriLabel: /عيد|فطر/.test(notes) ? notes : undefined,
      notes,
    });
  }

  // المصروفات — masjid expenses (sort by date; the sheet is unsorted).
  const expRows = readRows(wb.Sheets["المصروفات"]);
  const { index: expHeaderIdx, cols: expCols } = findHeader(expRows, ["التاريخ", "المبلغ"]);
  const masjidExpenses: Expense[] = [];
  const expenseIssues: { type: string; detail: string }[] = [];
  for (let i = expHeaderIdx + 1; i < expRows.length; i++) {
    const r = expRows[i];
    const serial = r[expCols["التاريخ"]];
    const amount = toMoneyCents(r[expCols["المبلغ"]]) ?? 0;
    const notes = cleanArabic(r[expCols["ملاحظات"]]);
    if (typeof serial !== "number" && amount === 0) continue;
    if (!notes) expenseIssues.push({ type: "note-less-expense", detail: `€${amount / 100} on ${typeof serial === "number" ? serialToISO(serial) : "?"}` });
    masjidExpenses.push({
      id: `expense-masjid-${masjidExpenses.length + 1}`,
      scope: "masjid",
      date: typeof serial === "number" ? serialToISO(serial) : "",
      description: notes,
      amountCents: amount,
      category: classifyExpense(notes),
      observation: notes,
      createdByUid: "import",
      needsReview: !notes,
    });
  }
  masjidExpenses.sort((a, b) => a.date.localeCompare(b.date));

  return {
    members, pledgeMonths, neverPaid, quarantineCells, donations,
    donationsSum, fridayTotal, fridayCount, campaignLump, campaignDonors,
    campaignBuckets, masjidExpenses, donationIssues, expenseIssues,
  };
}

// --- Classification heuristics (flagged when uncertain) --------------------
function classifyDonation(date: string, name: string, notes: string): {
  channel: Donation["channel"];
  donorType: Donation["donorType"];
  anonymous: boolean;
  campaign?: string;
  fund?: string;
  needsReview: boolean;
} {
  const n = cleanArabic(notes);
  if (/جثة/.test(n)) return { channel: "fund", donorType: "individual", anonymous: false, fund: "funeral", needsReview: false };
  if (/جزار|hucha/i.test(n)) return { channel: "hucha", donorType: "box", anonymous: false, needsReview: false };
  if (/عيد الأضحى|الأضحى/.test(n)) return { channel: /نساء/.test(n) ? "eid_women" : "eid_men", donorType: "individual", anonymous: false, campaign: "eid_adha", needsReview: false };
  if (/العيد|عيد الفطر|عيد/.test(n)) return { channel: /نساء/.test(n) ? "eid_women" : "eid_men", donorType: "individual", anonymous: false, campaign: "eid_fitr", needsReview: false };
  if (/المشروع|ت\.المشروع|ت\s*[,، ]?\s*المشروع/.test(n)) return { channel: "campaign", donorType: "individual", anonymous: false, campaign: "project", needsReview: false };
  if (/محسن|محسنة/.test(name)) return { channel: "direct", donorType: "anonymous", anonymous: true, needsReview: false };
  if (/مسجد|سان/.test(n)) return { channel: "external", donorType: "mosque", anonymous: false, needsReview: false };
  if (date >= "2026-02-17" && date <= "2026-03-18") return { channel: "ramadan_daily", donorType: "individual", anonymous: false, campaign: "ramadan", needsReview: false };
  return { channel: "direct", donorType: "individual", anonymous: false, needsReview: true };
}

function classifyExpense(notes: string): Expense["category"] {
  const n = cleanArabic(notes);
  if (/فقيه|خطيب|paga|para|نومينا/.test(n)) return "imam_support";
  if (/اكرام|رمضان|إفطار/.test(n)) return "iftar_ramadan";
  if (/كهرباء|ماء|غاز|net|internet/i.test(n)) return "utilities";
  if (/neteja|تنظيف|نظافة/i.test(n)) return "cleaning";
  if (/كراسي|sillas|microfon|luces|platos|lavabo|extintors/i.test(n)) return "equipment";
  return "other";
}

// --- Main --------------------------------------------------------------------
function main() {
  const school = parseSchool();
  const masjid = parseMasjid();

  proposePersonMatches(school.familyList.map((f) => f.parentName));

  const masjidExpenseTotal = masjid.masjidExpenses.reduce((s, e) => s + e.amountCents, 0);

  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: DRY_RUN,
    shartMode: SHART_MODE,
    reconciliation: {
      members: { count: masjid.members.length, everPaid: masjid.members.length - masjid.neverPaid.length, neverPaid: masjid.neverPaid.length, totalCents: masjid.pledgeMonths.reduce((s, p) => s + (SHART_MODE === "collected" ? p.paidCents : p.expectedCents), 0) },
      pledgeMonths: { count: masjid.pledgeMonths.length },
      masjidDonations: { count: masjid.donations.filter((d) => d.channel !== "friday_box").length, totalCents: masjid.donationsSum },
      fridayBox: { count: masjid.fridayCount, totalCents: masjid.fridayTotal },
      ramadanCampaignDonors: { count: masjid.campaignDonors.length, totalCents: masjid.campaignLump },
      campaigns: {
        ramadan: masjid.campaignBuckets.ramadan,
        eidFitr: masjid.campaignBuckets.eid_fitr,
        eidAdha: masjid.campaignBuckets.eid_adha,
        project: masjid.campaignBuckets.project,
        funeral: masjid.campaignBuckets.funeral,
      },
      masjidExpenses: { count: masjid.masjidExpenses.length, totalCents: masjidExpenseTotal },
      schoolFamilies: { count: school.familyList.length, students: school.students.length, reservedStudents: school.reservedStudents.length },
      schoolInvoices: { count: school.invoices.length, billableCents: school.billableTotal },
      schoolOpeningPayments: { count: school.openingPayments.length, totalCents: school.collectedTotal },
      schoolExpenses: { count: school.expenses.length, totalCents: school.expenses.reduce((s, e) => s + e.amountCents, 0) },
      schoolTransfers: { count: school.transfers.length, totalCents: school.transfers.reduce((s, t) => s + t.amountCents, 0) },
    },
    variances: [
      { item: "masjid donations", actualCents: masjid.donationsSum, planTarget: 1466100, note: "plan audit said €14,661 (row-sum) / €14,666 (stated); actual ledger sum is €14,665.84" },
      { item: "masjid expenses", actualCents: masjidExpenseTotal, planTarget: 672035, note: "plan audit said €6,720.35; actual row sum is €6,720.03" },
    ],
    classificationNote:
      "Donation channel/campaign/fund labels are best-effort (data has sparse notes); plan §2.3's Ramadan/Eid/funeral breakdown is not explicitly labelled in the sheet and requires human review. Only 'المشروع' (€750) and the Ramadan date-window are reliably classifiable.",
    needsReview: [
      ...masjid.donationIssues,
      ...masjid.expenseIssues,
      ...masjid.quarantineCells.map((c) => ({ type: "post-sep-pledge-cell", detail: `${c.member} ${c.month} = €${c.cents / 100}` })),
      ...school.duplicatePhones.map((d) => ({ type: "duplicate-family-phone", detail: `${d.name}: ${d.phones.join(", ")}` })),
      ...school.xSuffixNames.map((n) => ({ type: "x-suffix-name", detail: n })),
    ],
    persons: { proposed: personsMatches },
  };

  const outPath = resolve(ROOT, "migration-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Wrote ${outPath}`);
  console.log(JSON.stringify(report.reconciliation, null, 2));
  console.log(`\nvariances: ${report.variances.length} · needsReview: ${report.needsReview.length} · persons proposed: ${personsMatches.length}`);
}

main();
