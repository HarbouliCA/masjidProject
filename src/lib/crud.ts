/**
 * Directory CRUD — members, families, students, classes, teachers, salaries,
 * settings. Soft-delete only (archive via isActive=false); no hard deletes
 * while an entity is referenced by history.
 *
 * The Firestore document ID is the identity: builders return data WITHOUT an
 * `id` field, `record*` uses `addDoc` (the hook maps `d.id` back in), and
 * `update*` target the document by its Firestore id.
 */
import { addDoc, collection, doc, setDoc, updateDoc, deleteField, deleteDoc } from "firebase/firestore";
import { getFirestoreDb } from "./firestore/client";
import { deriveObligationStatus } from "./ledger";
import { stripUndefined } from "./sanitize";
import type {
  Cents,
  Class,
  Family,
  Member,
  Settings,
  Student,
  Teacher,
  Invoice,
  Scope,
  Expense,
  Donation,
  Transfer,
  CampaignDonor,
} from "./schema";

// --- Members ---------------------------------------------------------------
export interface MemberInput {
  fullName: string;
  monthlyPledgeCents: Cents;
  startMonth?: string;
  notes?: string;
}

export function buildMember(input: MemberInput): Omit<Member, "id"> {
  if (!input.fullName.trim()) throw new Error("member name is required");
  if (!Number.isInteger(input.monthlyPledgeCents) || input.monthlyPledgeCents <= 0) {
    throw new Error("monthly pledge must be a positive integer (cents)");
  }
  return {
    fullName: input.fullName.trim(),
    monthlyPledgeCents: input.monthlyPledgeCents,
    startMonth: input.startMonth ?? "2026-01",
    status: "never_paid",
    notes: input.notes ?? "",
    isActive: true,
  };
}

export async function recordMember(input: MemberInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "members"), stripUndefined(buildMember(input)));
  return ref.id;
}

export async function updateMember(
  id: string,
  patch: Partial<Omit<Member, "id">>
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await updateDoc(doc(db, "members", id), stripUndefined(patch));
}

export async function archiveMember(id: string): Promise<void> {
  await updateMember(id, { isActive: false });
}

export async function unarchiveMember(id: string): Promise<void> {
  await updateMember(id, { isActive: true });
}

export async function deleteMemberPermanent(id: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await deleteDoc(doc(db, "members", id));
}

// --- Families --------------------------------------------------------------
export interface FamilyInput {
  parentName: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export function buildFamily(input: FamilyInput): Omit<Family, "id"> {
  if (!input.parentName.trim()) throw new Error("parent name is required");
  return {
    parentName: input.parentName.trim(),
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    notes: input.notes ?? "",
  };
}

export async function recordFamily(input: FamilyInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "families"), stripUndefined(buildFamily(input)));
  return ref.id;
}

export async function updateFamily(
  id: string,
  patch: Partial<Omit<Family, "id">>
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await updateDoc(doc(db, "families", id), stripUndefined(patch));
}

export async function archiveFamily(id: string): Promise<void> {
  await updateFamily(id, { isActive: false });
}

export async function unarchiveFamily(id: string): Promise<void> {
  await updateFamily(id, { isActive: true });
}

export async function deleteFamilyPermanent(id: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await deleteDoc(doc(db, "families", id));
}

// --- Students --------------------------------------------------------------
export interface StudentInput {
  familyId: string;
  name: string;
  level?: string;
  englishEnrolled?: boolean;
  classId?: string;
}

export function buildStudent(input: StudentInput): Omit<Student, "id"> {
  if (!input.name.trim()) throw new Error("student name is required");
  if (!input.familyId) throw new Error("student family is required");
  return {
    familyId: input.familyId,
    name: input.name.trim(),
    level: input.level ?? "المستوى الأول",
    englishEnrolled: input.englishEnrolled ?? false,
    classId: input.classId,
  };
}

export async function recordStudent(input: StudentInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "students"), stripUndefined(buildStudent(input)));
  return ref.id;
}

export async function updateStudent(
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await updateDoc(doc(db, "students", id), stripUndefined(patch));
}

export async function assignStudentToClass(id: string, classId: string): Promise<void> {
  await updateStudent(id, { classId });
}

export async function archiveStudent(id: string): Promise<void> {
  await updateStudent(id, { isActive: false });
}

export async function unarchiveStudent(id: string): Promise<void> {
  await updateStudent(id, { isActive: true });
}

export async function deleteStudentPermanent(id: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await deleteDoc(doc(db, "students", id));
}

/** Unassign a student from their class (removes the classId field). */
export async function removeStudentFromClass(id: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await updateDoc(doc(db, "students", id), { classId: deleteField() });
}

// --- Classes ---------------------------------------------------------------
export interface ClassInput {
  name: string;
  level?: string;
  teacherId?: string;
  notes?: string;
}

export function buildClass(input: ClassInput): Omit<Class, "id"> {
  if (!input.name.trim()) throw new Error("class name is required");
  return {
    name: input.name.trim(),
    level: input.level?.trim() || undefined,
    teacherId: input.teacherId,
    isActive: true,
    notes: input.notes ?? "",
  };
}

export async function recordClass(input: ClassInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "classes"), stripUndefined(buildClass(input)));
  return ref.id;
}

export async function updateClass(
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await updateDoc(doc(db, "classes", id), stripUndefined(patch));
}

export async function archiveClass(id: string): Promise<void> {
  await updateClass(id, { isActive: false });
}

export async function unarchiveClass(id: string): Promise<void> {
  await updateClass(id, { isActive: true });
}

export async function deleteClassPermanent(id: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await deleteDoc(doc(db, "classes", id));
}

// --- Teachers --------------------------------------------------------------
export interface TeacherInput {
  fullName: string;
  phone?: string;
  email?: string;
  monthlySalaryCents?: Cents;
  notes?: string;
}

export function buildTeacher(input: TeacherInput): Omit<Teacher, "id"> {
  if (!input.fullName.trim()) throw new Error("teacher name is required");
  if (
    input.monthlySalaryCents !== undefined &&
    (!Number.isInteger(input.monthlySalaryCents) || input.monthlySalaryCents < 0)
  ) {
    throw new Error("monthly salary must be a non-negative integer (cents)");
  }
  return {
    fullName: input.fullName.trim(),
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    monthlySalaryCents: input.monthlySalaryCents,
    isActive: true,
    notes: input.notes ?? "",
  };
}

export async function recordTeacher(input: TeacherInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "teachers"), stripUndefined(buildTeacher(input)));
  return ref.id;
}

export async function updateTeacher(
  id: string,
  patch: Partial<Omit<Teacher, "id">>
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await updateDoc(doc(db, "teachers", id), stripUndefined(patch));
}

export async function archiveTeacher(id: string): Promise<void> {
  await updateTeacher(id, { isActive: false });
}

export async function unarchiveTeacher(id: string): Promise<void> {
  await updateTeacher(id, { isActive: true });
}

export async function deleteTeacherPermanent(id: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await deleteDoc(doc(db, "teachers", id));
}

// --- Salaries (idempotent on teacherId + month) ----------------------------
export function salaryDocId(teacherId: string, month: string): string {
  return `salary-${teacherId}-${month}`;
}

export interface SalaryUpsertInput {
  teacherId: string;
  month: string;
  expectedCents: Cents;
  paidCents: Cents;
  paidAt?: string;
  notes?: string;
}

export function buildSalaryPayment(input: SalaryUpsertInput): {
  teacherId: string;
  month: string;
  expectedCents: Cents;
  paidCents: Cents;
  status: "unpaid" | "partial" | "paid" | "waived";
  paidAt?: string;
  notes: string;
} {
  return {
    teacherId: input.teacherId,
    month: input.month,
    expectedCents: input.expectedCents,
    paidCents: input.paidCents,
    status: deriveObligationStatus(input.expectedCents, input.paidCents),
    paidAt: input.paidAt,
    notes: input.notes ?? "",
  };
}

export async function upsertSalaryPayment(input: SalaryUpsertInput): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const id = salaryDocId(input.teacherId, input.month);
  await setDoc(doc(db, "salaryPayments", id), stripUndefined(buildSalaryPayment(input)));
}

export async function markSalaryPaid(
  teacherId: string,
  month: string,
  expectedCents: Cents
): Promise<void> {
  await upsertSalaryPayment({
    teacherId,
    month,
    expectedCents,
    paidCents: expectedCents,
    paidAt: new Date().toISOString(),
  });
}

// --- Invoices (Fees Calendar) --------------------------------------------
export function invoiceDocId(familyId: string, month: string): string {
  return `invoice-${familyId}-${month}`;
}

export interface InvoiceUpsertInput {
  familyId: string;
  month: string;
  arabicChildren: number;
  arabicFeeCents: Cents;
  englishChildren: number;
  englishFeeCents: Cents;
  totalCents: Cents;
  paidCents: Cents;
  isManualOverride: boolean;
  notes?: string;
}

export function buildInvoice(input: InvoiceUpsertInput): Omit<Invoice, "id" | "academicYearId"> {
  const status = deriveObligationStatus(input.totalCents, input.paidCents);
  return {
    familyId: input.familyId,
    month: input.month,
    arabicChildren: input.arabicChildren,
    arabicFeeCents: input.arabicFeeCents,
    englishChildren: input.englishChildren,
    englishFeeCents: input.englishFeeCents,
    totalCents: input.totalCents,
    paidCents: input.paidCents,
    status,
    isManualOverride: input.isManualOverride,
    notes: input.notes ?? "",
  };
}

export async function upsertInvoice(input: InvoiceUpsertInput): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  const id = invoiceDocId(input.familyId, input.month);
  await setDoc(doc(db, "invoices", id), stripUndefined({ ...buildInvoice(input), academicYearId: "2025-2026" }));
}

// --- Expenses (school) -----------------------------------------------------
export interface ExpenseDocInput {
  scope: Scope;
  date: string;
  description: string;
  amountCents: Cents;
  category: Expense["category"];
  observation?: string;
}

export function buildExpenseDoc(input: ExpenseDocInput): Omit<Expense, "id"> {
  if (!input.date) throw new Error("expense date is required");
  if (!input.description.trim()) throw new Error("expense description is required");
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error("expense amount must be a positive integer (cents)");
  }
  return {
    scope: input.scope,
    date: input.date,
    description: input.description.trim(),
    amountCents: input.amountCents,
    category: input.category,
    observation: input.observation ?? "",
    createdByUid: "client",
    isActive: true,
  };
}

export async function recordExpenseDoc(input: ExpenseDocInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "expenses"), stripUndefined(buildExpenseDoc(input)));
  return ref.id;
}

export async function updateExpenseDoc(id: string, patch: Record<string, unknown>): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await updateDoc(doc(db, "expenses", id), stripUndefined(patch));
}

export async function archiveExpenseDoc(id: string): Promise<void> {
  await updateExpenseDoc(id, { isActive: false });
}

export async function unarchiveExpenseDoc(id: string): Promise<void> {
  await updateExpenseDoc(id, { isActive: true });
}

export async function deleteExpenseDoc(id: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await deleteDoc(doc(db, "expenses", id));
}

// --- Donations -------------------------------------------------------------
export interface DonationDocInput {
  date: string;
  donorName?: string;
  amountCents: Cents;
  notes?: string;
  channel?: Donation["channel"];
  donorType?: Donation["donorType"];
}

export function buildDonationDoc(input: DonationDocInput): Omit<Donation, "id"> {
  if (!input.date) throw new Error("donation date is required");
  if (!Number.isInteger(input.amountCents) || input.amountCents < 0) {
    throw new Error("donation amount must be a non-negative integer (cents)");
  }
  return {
    date: input.date,
    amountCents: input.amountCents,
    method: "cash",
    channel: input.channel ?? "direct",
    donorType: input.donorType ?? (input.donorName ? "individual" : "anonymous"),
    donorName: input.donorName?.trim() || undefined,
    receiptIssued: false,
    notes: input.notes ?? "",
    isActive: true,
  };
}

export async function recordDonationDoc(input: DonationDocInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "donations"), stripUndefined(buildDonationDoc(input)));
  return ref.id;
}

export async function updateDonationDoc(id: string, patch: Record<string, unknown>): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await updateDoc(doc(db, "donations", id), stripUndefined(patch));
}

export async function archiveDonationDoc(id: string): Promise<void> {
  await updateDonationDoc(id, { isActive: false });
}

export async function unarchiveDonationDoc(id: string): Promise<void> {
  await updateDonationDoc(id, { isActive: true });
}

export async function deleteDonationDoc(id: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await deleteDoc(doc(db, "donations", id));
}

// --- Transfers -------------------------------------------------------------
export interface TransferDocInput {
  fromScope: Scope;
  toScope: Scope;
  amountCents: Cents;
  date: string;
  notes?: string;
}

export function buildTransferDoc(input: TransferDocInput): Omit<Transfer, "id"> {
  if (input.fromScope === input.toScope) throw new Error("transfer must cross scopes");
  if (!input.date) throw new Error("transfer date is required");
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error("transfer amount must be a positive integer (cents)");
  }
  return {
    fromScope: input.fromScope,
    toScope: input.toScope,
    amountCents: input.amountCents,
    date: input.date,
    createdByUid: "client",
    notes: input.notes ?? "",
  };
}

export async function recordTransferDoc(input: TransferDocInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "transfers"), stripUndefined(buildTransferDoc(input)));
  return ref.id;
}

export async function updateTransferDoc(id: string, patch: Record<string, unknown>): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await updateDoc(doc(db, "transfers", id), stripUndefined(patch));
}

export async function deleteTransferDoc(id: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await deleteDoc(doc(db, "transfers", id));
}

// --- Campaign donors -------------------------------------------------------
export interface CampaignDonorDocInput {
  campaignId: string;
  name: string;
  amountCents: Cents;
}

export function buildCampaignDonorDoc(input: CampaignDonorDocInput): Omit<CampaignDonor, "id"> {
  if (!input.campaignId) throw new Error("campaign id is required");
  if (!input.name.trim()) throw new Error("donor name is required");
  if (!Number.isInteger(input.amountCents) || input.amountCents < 0) {
    throw new Error("donation amount must be a non-negative integer (cents)");
  }
  return {
    campaignId: input.campaignId,
    name: input.name.trim(),
    amountCents: input.amountCents,
    isActive: true,
  };
}

export async function recordCampaignDonorDoc(input: CampaignDonorDocInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "campaignDonors"), stripUndefined(buildCampaignDonorDoc(input)));
  return ref.id;
}

export async function updateCampaignDonorDoc(id: string, patch: Record<string, unknown>): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await updateDoc(doc(db, "campaignDonors", id), stripUndefined(patch));
}

export async function archiveCampaignDonorDoc(id: string): Promise<void> {
  await updateCampaignDonorDoc(id, { isActive: false });
}

export async function unarchiveCampaignDonorDoc(id: string): Promise<void> {
  await updateCampaignDonorDoc(id, { isActive: true });
}

export async function deleteCampaignDonorDoc(id: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await deleteDoc(doc(db, "campaignDonors", id));
}

// --- Settings (single doc "organization") ----------------------------------
export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  await setDoc(doc(db, "settings", "organization"), stripUndefined(patch), { merge: true });
}
