"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGrades, useStudents } from "@/lib/data/hooks";
import { recordGrade } from "@/lib/mutations";
import { formatDate } from "@/lib/dates";
import type { Dictionary, TranslationKey } from "@/i18n";

const SUBJECTS = ["quran", "arabic", "islamic"] as const;
type SubjectKey = (typeof SUBJECTS)[number];

export function GradebookList({ t }: { t: Dictionary }) {
  const { data: grades = [] } = useGrades();
  const { data: students = [] } = useStudents();
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState<SubjectKey>("quran");
  const [score, setScore] = useState("");

  const sorted = [...grades].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? id;

  async function submit() {
    const value = Number(score);
    const student = students.find((s) => s.id === studentId);
    if (!student || !Number.isFinite(value)) return;
    await recordGrade({
      studentId: student.id,
      familyId: student.familyId,
      subject,
      score: value,
      maxScore: 10,
    });
    queryClient.invalidateQueries();
    setScore("");
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
          value={subject}
          onChange={(e) => setSubject(e.target.value as SubjectKey)}
          className="rounded-lg border border-nour-gold-300/60 bg-surface px-3 py-2"
        >
          {SUBJECTS.map((k) => (
            <option key={k} value={k}>
              {t[k]}
            </option>
          ))}
        </select>
        <input
          dir="ltr"
          inputMode="decimal"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder={t.score}
          className="w-20 rounded-lg border border-nour-gold-300/60 bg-surface px-3 py-2 text-end tabular-nums"
        />
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
                <th className="px-4 py-3 text-start font-medium">{t.subject}</th>
                <th className="px-4 py-3 text-start font-medium">{t.score}</th>
                <th className="px-4 py-3 text-start font-medium">{t.date}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((g) => (
                <tr key={g.id} className="border-b border-nour-gold-300/20 last:border-0">
                  <td className="px-4 py-3">
                    <span dir="auto">{studentName(g.studentId)}</span>
                  </td>
                  <td className="px-4 py-3">{t[g.subject as TranslationKey] ?? g.subject}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {g.score}/{g.maxScore}
                  </td>
                  <td className="px-4 py-3">
                    {g.date ? formatDate(new Date(`${g.date}T12:00:00Z`)) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
