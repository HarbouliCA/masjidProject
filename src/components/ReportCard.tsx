"use client";

import { useStudents, useGrades, useAttendance } from "@/lib/data/hooks";
import { formatDate } from "@/lib/dates";
import type { Dictionary, TranslationKey } from "@/i18n";

export function ReportCard({
  t,
  studentId,
}: {
  t: Dictionary;
  studentId: string;
}) {
  const { data: students = [] } = useStudents();
  const { data: grades = [] } = useGrades();
  const { data: attendance = [] } = useAttendance();

  const student = students.find((s) => s.id === studentId);
  const studentGrades = grades.filter((g) => g.studentId === studentId);
  const studentAttendance = attendance.filter((a) => a.studentId === studentId);
  const present = studentAttendance.filter((a) => a.status === "present").length;
  const absent = studentAttendance.filter((a) => a.status === "absent").length;

  if (!student) {
    return <p className="py-12 text-center text-sm text-nour-stone-400">{t.loading}</p>;
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg bg-nour-green-900 px-4 py-2 text-sm text-nour-cream-50 print:hidden dark:bg-nour-gold-500 dark:text-nour-green-900"
      >
        {t.print}
      </button>

      <div className="rounded-xl border border-nour-gold-300/40 bg-surface p-8">
        <header className="border-b-2 border-nour-gold-500 pb-4 text-center">
          <h1 className="font-heading text-2xl font-semibold">{t.appName}</h1>
          <p className="mt-1 text-sm text-nour-stone-400">{t.reportCard}</p>
        </header>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <p>
            <span className="text-nour-stone-400">{t.student}: </span>
            <span dir="auto" className="font-medium">{student.name}</span>
          </p>
          <p>
            <span className="text-nour-stone-400">{t.level}: </span>
            <span className="font-medium">{student.level}</span>
          </p>
        </div>

        <section className="mt-8">
          <h2 className="mb-2 font-heading text-lg font-semibold">{t.gradebook}</h2>
          {studentGrades.length === 0 ? (
            <p className="text-sm text-nour-stone-400">{t.emptyState}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-nour-gold-300/40 text-nour-stone-400">
                  <th className="py-2 text-start font-medium">{t.subject}</th>
                  <th className="py-2 text-start font-medium">{t.score}</th>
                </tr>
              </thead>
              <tbody>
                {studentGrades.map((g) => (
                  <tr key={g.id} className="border-b border-nour-gold-300/20 last:border-0">
                    <td className="py-2">{t[g.subject as TranslationKey] ?? g.subject}</td>
                    <td className="py-2 tabular-nums">
                      {g.score}/{g.maxScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-2 font-heading text-lg font-semibold">{t.attendance}</h2>
          <p className="text-sm text-nour-stone-400">
            {t.present}: {present} · {t.absent}: {absent}
          </p>
        </section>

        <footer className="mt-10 border-t border-nour-gold-300/40 pt-4 text-center text-xs text-nour-stone-400">
          {formatDate(new Date())}
        </footer>
      </div>
    </div>
  );
}
