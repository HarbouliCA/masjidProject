import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { getFirestoreDb } from "../firestore/client";
import type { Family, Student, Member, PledgeMonth, Invoice, Donation, Expense, Transfer, Payment, Grade, Attendance, Class, Teacher, SalaryPayment, Event, PrayerTime, Announcement, AuditLog } from "../schema";

export type DirectoryKind = "families" | "students" | "members";

const COLLECTION: Record<DirectoryKind, string> = {
  families: "families",
  students: "students",
  members: "members",
};

/**
 * Read a collection. Returns [] when Firebase is unconfigured or the collection
 * is empty — the UI renders its empty state until the real import (plan §11)
 * writes documents.
 */
export function useCollection<T>(collectionName: string) {
  return useQuery({
    queryKey: [collectionName],
    queryFn: async (): Promise<T[]> => {
      const db = getFirestoreDb();
      if (!db) return [];
      const snap = await getDocs(collection(db, collectionName));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
    },
  });
}

export function useDirectory<T>(kind: DirectoryKind) {
  return useCollection<T>(COLLECTION[kind]);
}

export function useFamilies() {
  return useDirectory<Family>("families");
}

export function useStudents() {
  return useDirectory<Student>("students");
}

export function useMembers() {
  return useDirectory<Member>("members");
}

export function usePledgeMonths() {
  return useCollection<PledgeMonth>("pledgeMonths");
}

export function useInvoices() {
  return useCollection<Invoice>("invoices");
}

export function useDonations() {
  return useCollection<Donation>("donations");
}

export function useExpenses() {
  return useCollection<Expense>("expenses");
}

export function useTransfers() {
  return useCollection<Transfer>("transfers");
}

export function usePayments() {
  return useCollection<Payment>("payments");
}

export function useGrades() {
  return useCollection<Grade>("grades");
}

export function useAttendance() {
  return useCollection<Attendance>("attendance");
}

export function useClasses() {
  return useCollection<Class>("classes");
}

export function useTeachers() {
  return useCollection<Teacher>("teachers");
}

export function useSalaryPayments() {
  return useCollection<SalaryPayment>("salaryPayments");
}

export function useEvents() {
  return useCollection<Event>("events");
}

export function usePrayerTimes() {
  return useCollection<PrayerTime>("prayerTimes");
}

export function useAnnouncements() {
  return useCollection<Announcement>("announcements");
}

export function useAuditLog() {
  return useCollection<AuditLog>("auditLog");
}
