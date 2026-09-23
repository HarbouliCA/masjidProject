"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTeachers, useSalaryPayments } from "@/lib/data/hooks";
import { upsertSalaryPayment } from "@/lib/crud";
import { MASJID_GRID_MONTHS } from "@/lib/grid";
import type { Dictionary } from "@/i18n";

export function SalaryCalendar({ t }: { t: Dictionary }) {
  const { data: teachers = [] } = useTeachers();
  const { data: salaries = [] } = useSalaryPayments();
  const queryClient = useQueryClient();
  const active = teachers.filter((x) => x.isActive !== false);

  const paymentFor = (teacherId: string, month: string) =>
    salaries.find((s) => s.teacherId === teacherId && s.month === month);

  async function toggle(teacherId: string, month: string, expectedCents: number, currentlyPaid: boolean) {
    await upsertSalaryPayment({
      teacherId,
      month,
      expectedCents,
      paidCents: currentlyPaid ? 0 : expectedCents,
      paidAt: currentlyPaid ? undefined : new Date().toISOString(),
    });
    queryClient.invalidateQueries();
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-nour-gold-300/40 bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-nour-gold-300/40 text-muted">
            <th className="sticky inset-inline-start-0 bg-surface px-4 py-3 text-start font-medium">
              {t.teacher}
            </th>
            {MASJID_GRID_MONTHS.map((m) => (
              <th key={m.key} className="px-2 py-3 text-center font-medium">
                {m.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {active.map((teacher) => (
            <tr key={teacher.id} className="border-b border-nour-gold-300/20 last:border-0">
              <td className="sticky inset-inline-start-0 bg-surface px-4 py-2 font-medium">
                <span dir="auto">{teacher.fullName}</span>
              </td>
              {MASJID_GRID_MONTHS.map((m) => {
                const p = paymentFor(teacher.id, m.key);
                const expected = teacher.monthlySalaryCents ?? 0;
                const paid = !!p && p.paidCents >= expected && expected > 0;
                return (
                  <td key={m.key} className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      aria-label={`${teacher.fullName} ${m.label}`}
                      checked={paid}
                      onChange={() => toggle(teacher.id, m.key, expected, paid)}
                      className="h-4 w-4 accent-[var(--brand-gold)]"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
