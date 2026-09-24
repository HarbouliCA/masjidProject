"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTeachers, useSalaryPayments } from "@/lib/data/hooks";
import { upsertSalaryPayment } from "@/lib/crud";
import { TEACHER_SALARY_MONTHS } from "@/lib/grid";
import { Money } from "../Money";
import { PencilIcon } from "../icons/PencilIcon";
import { SalaryEditDialog, type SalaryEditContext } from "../SalaryEditDialog";
import type { Dictionary } from "@/i18n";
import type { SalaryPayment, Teacher } from "@/lib/schema";

export function SalaryCalendar({ t }: { t: Dictionary }) {
  const { data: teachers = [] } = useTeachers();
  const { data: salaries = [] } = useSalaryPayments();
  const queryClient = useQueryClient();
  const [editContext, setEditContext] = useState<SalaryEditContext | null>(null);
  const active = teachers.filter((x) => x.isActive !== false);

  const paymentFor = (teacherId: string, month: string): SalaryPayment | null =>
    salaries.find((s) => s.teacherId === teacherId && s.month === month) ?? null;

  async function togglePaid(
    teacherId: string,
    month: string,
    payment: SalaryPayment | null
  ) {
    const amount = payment?.expectedCents ?? 0;
    if (amount <= 0) return;
    const paid = payment ? payment.paidCents >= amount : false;
    await upsertSalaryPayment({
      teacherId,
      month,
      expectedCents: amount,
      paidCents: paid ? 0 : amount,
      paidAt: paid ? undefined : new Date().toISOString(),
    });
    queryClient.invalidateQueries();
  }

  function openEdit(teacher: Teacher, monthKey: string, monthLabel: string, payment: SalaryPayment | null) {
    setEditContext({
      teacherId: teacher.id,
      teacherName: teacher.fullName,
      month: monthKey,
      monthLabel,
      payment,
    });
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-nour-gold-300/40 bg-surface">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-nour-gold-300/40">
              <th className="sticky inset-inline-start-0 bg-surface px-4 py-3 text-start font-medium text-foreground">
                {t.teacher}
              </th>
              {TEACHER_SALARY_MONTHS.map((m) => (
                <th key={m.key} className="min-w-[6.5rem] px-2 py-3 text-center font-medium text-foreground">
                  {m.label}
                </th>
              ))}
              <th className="min-w-[6.5rem] px-2 py-3 text-center font-medium text-foreground bg-nour-gold-300/20">
                {t.total}
              </th>
            </tr>
          </thead>
          <tbody>
            {active.map((teacher) => {
              const paidTotal = TEACHER_SALARY_MONTHS.reduce((sum, m) => {
                const p = paymentFor(teacher.id, m.key);
                const amount = p?.expectedCents ?? 0;
                const paid = !!p && p.paidCents >= amount && amount > 0;
                return paid ? sum + amount : sum;
              }, 0);
              return (
              <tr key={teacher.id} className="border-b border-nour-gold-300/20 last:border-0">
                <td className="sticky inset-inline-start-0 bg-surface px-4 py-2 font-medium text-foreground">
                  <span dir="auto">{teacher.fullName}</span>
                </td>
                {TEACHER_SALARY_MONTHS.map((m) => {
                  const payment = paymentFor(teacher.id, m.key);
                  const amount = payment?.expectedCents ?? 0;
                  const paid = !!payment && payment.paidCents >= amount && amount > 0;
                  return (
                    <td key={m.key} className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`whitespace-nowrap tabular-nums ${
                            amount > 0 ? "text-foreground" : "text-muted"
                          }`}
                        >
                          {amount > 0 ? <Money cents={amount} /> : "—"}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEdit(teacher, m.key, m.label, payment)}
                          aria-label={
                            amount > 0
                              ? `${t.editSalary} ${m.label}`
                              : `${t.addSalary} ${m.label}`
                          }
                          className="rounded p-1 text-accent hover:text-nour-gold-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                        >
                          <PencilIcon />
                        </button>
                        <input
                          type="checkbox"
                          aria-label={`${teacher.fullName} ${m.label} ${paid ? t.status_paid : t.status_unpaid}`}
                          checked={paid}
                          disabled={amount <= 0}
                          onChange={() => togglePaid(teacher.id, m.key, payment)}
                          className="h-4 w-4 accent-[var(--brand-gold)]"
                        />
                      </div>
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center font-bold text-foreground bg-nour-gold-300/20">
                  {paidTotal > 0 ? <Money cents={paidTotal} /> : "0"}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <SalaryEditDialog
        t={t}
        context={editContext}
        onClose={() => setEditContext(null)}
      />
    </>
  );
}
