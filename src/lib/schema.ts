/**
 * Firestore domain types — one ledger, two books (plan §6).
 *
 * All money is integer cents (`Cents`), never floats. Statuses on obligations
 * are derived in transactions, never typed by hand. Month keys are strings
 * ("2026-01"), never Date objects in IDs.
 */

/** Integer euro cents — the only monetary representation. */
export type Cents = number;

export type Scope = "masjid" | "school";

export type MonthKey = string; // "2026-01"

export type PersonLinkKind = "family" | "member" | "teacher";

export interface Person {
  id: string;
  canonicalName: string;
  aliases: { text: string; source: string }[];
  phone?: string;
  email?: string;
  links: { familyId?: string; memberId?: string; teacherId?: string };
  matchConfidence: "confirmed" | "proposed";
  needsReview: boolean;
  notes: string;
}

export type MemberStatus = "active" | "lapsed" | "never_paid" | "left";

export interface Member {
  id: string;
  personId?: string;
  fullName: string;
  monthlyPledgeCents: Cents; // standard amount (default 1000)
  startMonth: MonthKey;
  endMonth?: MonthKey;
  status: MemberStatus; // derived, not typed by hand
  notes: string;
  isActive: boolean;
}

export type PledgeMonthStatus = "unpaid" | "partial" | "paid" | "waived";

export interface PledgeMonth {
  id: string;
  memberId: string;
  month: MonthKey;
  expectedCents: Cents;
  paidCents: Cents;
  status: PledgeMonthStatus;
  notes: string;
}

export type InvoiceStatus = "unpaid" | "partial" | "paid" | "waived";

export interface Invoice {
  id: string;
  familyId: string;
  academicYearId: string;
  month: MonthKey;
  arabicChildren: number;
  arabicFeeCents: Cents;
  englishChildren: number;
  englishFeeCents: Cents;
  totalCents: Cents;
  paidCents: Cents;
  status: InvoiceStatus;
  isManualOverride: boolean;
  dueDate?: string;
  notes: string;
}

export interface Payment {
  id: string;
  scope: Scope;
  against: { type: "invoice" | "pledgeMonth"; id: string };
  familyId?: string;
  memberId?: string;
  amountCents: Cents;
  paidAt: string;
  method: "cash" | "transfer" | "bizum";
  receivedByUid: string;
  reference?: string;
  receiptUrl?: string;
}

export type DonationChannel =
  | "friday_box"
  | "ramadan_daily"
  | "eid_men"
  | "eid_women"
  | "hucha"
  | "direct"
  | "external"
  | "campaign"
  | "fund";

export type DonorType =
  | "individual"
  | "anonymous"
  | "organization"
  | "mosque"
  | "box";

export interface Donation {
  id: string;
  date: string; // ISO date; null (undated) rows flagged via needsReview
  amountCents: Cents;
  method: "cash" | "transfer" | "bizum";
  channel: DonationChannel;
  donorType: DonorType;
  donorName?: string; // labelOnReceipt when anonymous (replaces "محسن")
  personId?: string;
  campaignId?: string;
  fundId?: string;
  receiptIssued: boolean;
  hijriLabel?: string;
  notes: string;
  needsReview?: boolean;
}

export interface Fund {
  id: string;
  name: string;
  purpose: string;
  policy: string;
  isActive: boolean; // balance derived from donations − disbursements
}

export type CampaignType =
  | "ramadan"
  | "eid_fitr"
  | "eid_adha"
  | "project"
  | "general";

export interface Campaign {
  id: string;
  type: CampaignType;
  hijriYear?: number;
  title: string;
  description: string;
  targetCents?: Cents;
  raisedCents: Cents; // derived
  start: string;
  end: string;
  isActive: boolean;
}

export interface RecurringExpense {
  id: string;
  label: string;
  payee?: string;
  amountCents: Cents;
  frequency: "monthly" | "weekly" | "per_jumuah";
  anchor: string;
  activeFrom: string;
  activeTo?: string;
  category: string;
  autoCreate: boolean;
  notes: string;
}

export interface Vendor {
  id: string;
  name: string;
  aliases: string[];
  defaultCategory?: string;
}

export type ExpenseCategory =
  | "imam_support"
  | "khatib_fees"
  | "salaries"
  | "iftar_ramadan"
  | "utilities"
  | "maintenance"
  | "supplies"
  | "cleaning"
  | "equipment"
  | "bank_fees"
  | "events"
  | "charity"
  | "transfer"
  | "other";

export interface Expense {
  id: string;
  scope: Scope;
  date: string;
  description: string;
  amountCents: Cents;
  category: ExpenseCategory;
  vendorId?: string;
  recurringId?: string;
  fundId?: string;
  observation: string;
  createdByUid: string;
  attachmentUrl?: string;
  needsReview?: boolean;
}

export interface Transfer {
  id: string;
  fromScope: Scope;
  toScope: Scope;
  amountCents: Cents;
  date: string;
  reference?: string;
  createdByUid: string;
  notes: string;
}

export interface Family {
  id: string;
  parentName: string;
  phone?: string;
  email?: string;
  reserved?: boolean;
  isActive?: boolean;
  notes: string;
}

export interface Student {
  id: string;
  familyId: string;
  classId?: string;
  name: string;
  level: string;
  englishEnrolled: boolean;
  reserved?: boolean;
  isActive?: boolean;
}

export interface Settings {
  pricing: {
    oneChild: Cents;
    twoChildren: Cents;
    threePlusChildren: Cents;
    englishPerChild: Cents;
  };
  organization: {
    iban: string;
    titular: string;
    concepto: string;
    fiscalYear: string;
    openingBalances: { masjid: Cents; school: Cents };
  };
}

export interface Class {
  id: string;
  name: string; // اسم الفصل
  level?: string; // مستوى الفصل
  teacherId?: string;
  isActive?: boolean;
  notes: string;
}

export interface Teacher {
  id: string;
  personId?: string;
  fullName: string;
  phone?: string;
  email?: string;
  monthlySalaryCents?: Cents;
  isActive?: boolean;
  notes: string;
}

export interface Grade {
  id: string;
  studentId: string;
  familyId: string;
  subject: string;
  score: number;
  maxScore: number;
  date: string;
  notes: string;
}

export type AttendanceStatus = "present" | "absent" | "late";

export interface Attendance {
  id: string;
  studentId: string;
  familyId: string;
  date: string;
  status: AttendanceStatus;
  notes: string;
}

export interface SalaryPayment {
  id: string;
  teacherId: string;
  month: MonthKey;
  expectedCents: Cents;
  paidCents: Cents;
  status: "unpaid" | "partial" | "paid" | "waived";
  paidAt?: string;
  notes: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  start: string; // ISO datetime
  end?: string;
  location?: string;
  hijriLabel?: string;
}

export interface PrayerTime {
  id: string; // date key "2026-01-01"
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  pinned: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  what: string;
  who: string;
  before?: string;
  after?: string;
  at: string;
}

export type UserRole = "admin" | "treasurer" | "teacher" | "parent" | "viewer";

export interface UserProfile {
  id: string; // Firebase Auth uid
  email: string;
  role: UserRole;
  familyId?: string;
  memberId?: string;
  disabled?: boolean;
}
