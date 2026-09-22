"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAttendance, useStudents } from "@/lib/data/hooks";
import { recordAttendance } from "@/lib/mutations";
import { formatDate } from "@/lib/dates";
import type { Dictionary } from "@/i18n";
import type { AttendanceStatus } from "@/lib/schema";

export function AttendanceList({ t }: { t: Dictionary }) {
  const { data = [] } = useAttendance();
  const { data: students = [] } = useStudents();
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState<AttendanceStatus>("present");

  const sorted = [...data].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? id;
  const statusLabel: Record<AttendanceStatus, string> = {
    present: t.present,
    absent: t.absent,
    late: t.late,
  };

  async function submit() {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    await recordAttendance({
      studentId: student.id,
      familyId: student.familyId,
      date: new Date().toISOString().slice(0, 10),
      status,
    });
    queryClient.invalidateQueries();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-nour-gold-300/40 bg-surface p-4">
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="grow rounded-lg border border-nour-gold-300/60 bg-surface px-3 py-2"
        >
          <option value="">{t.student}</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
          className="rounded-lg border border-nour-gold-300/60 bg-surface px-3 py-2"
        >
          <option value="present">{t.present}</option>
          <option value="absent">{t.absent}</option>
          <option value="late">{t.late}</option>
        </select>
        <button
          type="button"
          onClick={submit}
          className="rounded-lg bg-nour-green-900 px-4 py-2 text-sm text-nour-cream-50 dark:bg-nour-gold-500 dark:text-nour-green-900"
        >
          {t.save}
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-nour-gold-300/40 bg-surface py-12 text-center">
          <p className="text-sm text-nour-stone-400">{t.emptyState}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nour-gold-300/40 bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-nour-gold-300/40 text-nour-stone-400">
                <th className="px-4 py-3 text-start font-medium">{t.student}</th>
                <th className="px-4 py-3 text-start font-medium">{t.date}</th>
                <th className="px-4 py-3 text-start font-medium">{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id} className="border-b border-nour-gold-300/20 last:border-0">
                  <td className="px-4 py-3">
                    <span dir="auto">{studentName(a.studentId)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {a.date ? formatDate(new Date(`${a.date}T12:00:00Z`)) : "—"}
                  </td>
                  <td className="px-4 py-3">{statusLabel[a.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
