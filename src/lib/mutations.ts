/**
 * Append-only money mutations (الأمانة).
 *
 * Every financial movement is written as a NEW document — never updated or
 * deleted. The Firestore rules (plan §7) reject update/delete on these
 * collections, so corrections are expressed as new documents. auditLog is
 * written by a Cloud Function (onPaymentWrite / onDonationWrite), never by the
 * client — the rules deny client writes to auditLog.
 */
import { addDoc, collection } from "firebase/firestore";
import { getFirestoreDb } from "./firestore/client";
import type {
  Cents,
  Donation,
  Expense,
  Payment,
  Scope,
  Transfer,
  Grade,
  Attendance,
  AttendanceStatus,
  Event,
  Announcement,
} from "./schema";

function buildId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type PaymentMethod = "cash" | "transfer" | "bizum";

export interface PaymentInput {
  scope: Scope;
  againstType: "invoice" | "pledgeMonth";
  againstId: string;
  familyId?: string;
  memberId?: string;
  amountCents: Cents;
  method: PaymentMethod;
  receivedByUid: string;
  reference?: string;
}

export function buildPayment(input: PaymentInput): Payment {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error("payment amount must be a positive integer (cents)");
  }
  return {
    id: buildId("payment"),
    scope: input.scope,
    against: { type: input.againstType, id: input.againstId },
    familyId: input.familyId,
    memberId: input.memberId,
    amountCents: input.amountCents,
    paidAt: new Date().toISOString(),
    method: input.method,
    receivedByUid: input.receivedByUid,
    reference: input.reference,
  };
}

export async function recordPayment(input: PaymentInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "payments"), buildPayment(input));
  return ref.id;
}

export interface DonationInput {
  amountCents: Cents;
  channel: Donation["channel"];
  donorType: Donation["donorType"];
  donorName?: string;
  campaignId?: string;
  fundId?: string;
  hijriLabel?: string;
  notes?: string;
}

export function buildDonation(input: DonationInput): Donation {
  if (!Number.isInteger(input.amountCents) || input.amountCents < 0) {
    throw new Error("donation amount must be a non-negative integer (cents)");
  }
  return {
    id: buildId("donation"),
    date: new Date().toISOString().slice(0, 10),
    amountCents: input.amountCents,
    method: "cash",
    channel: input.channel,
    donorType: input.donorType,
    donorName: input.donorName,
    campaignId: input.campaignId,
    fundId: input.fundId,
    receiptIssued: false,
    hijriLabel: input.hijriLabel,
    notes: input.notes ?? "",
  };
}

export async function recordDonation(input: DonationInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "donations"), buildDonation(input));
  return ref.id;
}

export interface ExpenseInput {
  scope: Scope;
  description: string;
  amountCents: Cents;
  category: Expense["category"];
  observation?: string;
}

export function buildExpense(input: ExpenseInput): Expense {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error("expense amount must be a positive integer (cents)");
  }
  return {
    id: buildId("expense"),
    scope: input.scope,
    date: new Date().toISOString().slice(0, 10),
    description: input.description,
    amountCents: input.amountCents,
    category: input.category,
    observation: input.observation ?? "",
    createdByUid: "client",
  };
}

export async function recordExpense(input: ExpenseInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "expenses"), buildExpense(input));
  return ref.id;
}

export interface TransferInput {
  fromScope: Scope;
  toScope: Scope;
  amountCents: Cents;
  reference?: string;
  notes?: string;
}

export function buildTransfer(input: TransferInput): Transfer {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error("transfer amount must be a positive integer (cents)");
  }
  return {
    id: buildId("transfer"),
    fromScope: input.fromScope,
    toScope: input.toScope,
    amountCents: input.amountCents,
    date: new Date().toISOString().slice(0, 10),
    reference: input.reference,
    createdByUid: "client",
    notes: input.notes ?? "",
  };
}

export async function recordTransfer(input: TransferInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "transfers"), buildTransfer(input));
  return ref.id;
}

export interface GradeInput {
  studentId: string;
  familyId: string;
  subject: string;
  score: number;
  maxScore: number;
  notes?: string;
}

export function buildGrade(input: GradeInput): Grade {
  if (!Number.isFinite(input.score)) {
    throw new Error("grade score must be a number");
  }
  return {
    id: buildId("grade"),
    studentId: input.studentId,
    familyId: input.familyId,
    subject: input.subject,
    score: input.score,
    maxScore: input.maxScore,
    date: new Date().toISOString().slice(0, 10),
    notes: input.notes ?? "",
  };
}

export async function recordGrade(input: GradeInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "grades"), buildGrade(input));
  return ref.id;
}

export interface AttendanceInput {
  studentId: string;
  familyId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export function buildAttendance(input: AttendanceInput): Attendance {
  return {
    id: buildId("attendance"),
    studentId: input.studentId,
    familyId: input.familyId,
    date: input.date,
    status: input.status,
    notes: input.notes ?? "",
  };
}

export async function recordAttendance(input: AttendanceInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "attendance"), buildAttendance(input));
  return ref.id;
}

export interface EventInput {
  title: string;
  description: string;
  start: string;
  end?: string;
  location?: string;
}

export function buildEvent(input: EventInput): Event {
  if (!input.title.trim()) throw new Error("event title is required");
  return {
    id: buildId("event"),
    title: input.title.trim(),
    description: input.description,
    start: input.start,
    end: input.end,
    location: input.location,
  };
}

export async function recordEvent(input: EventInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "events"), buildEvent(input));
  return ref.id;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  pinned?: boolean;
}

export function buildAnnouncement(input: AnnouncementInput): Announcement {
  if (!input.title.trim()) throw new Error("announcement title is required");
  return {
    id: buildId("announcement"),
    title: input.title.trim(),
    body: input.body,
    publishedAt: new Date().toISOString(),
    pinned: input.pinned ?? false,
  };
}

export async function recordAnnouncement(input: AnnouncementInput): Promise<string | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const ref = await addDoc(collection(db, "announcements"), buildAnnouncement(input));
  return ref.id;
}
