"use client";

import {
  useStudents,
  useFamilies,
  useInvoices,
  useExpenses,
  useSalaryPayments,
  useSettings,
} from "@/lib/data/hooks";
import { assessFees } from "@/lib/fees";
import { SCHOOL_GRID_MONTHS } from "@/lib/grid";
import { Money } from "../Money";
import type { Dictionary } from "@/i18n";

export function SchoolDashboardTab({ t }: { t: Dictionary }) {
  const { data: students = [] } = useStudents();
  const { data: families = [] } = useFamilies();
  const { data: invoices = [] } = useInvoices();
  const { data: expenses = [] } = useExpenses();
  const { data: salaries = [] } = useSalaryPayments();
  const { data: settings } = useSettings();

  const activeStudents = students.filter((s) => s.isActive !== false);
  const activeFamilies = families.filter((f) => f.isActive !== false);

  // Paid income = total of "المجموع" in الفواتير: sum of paidCents for checked months.
  const paidIncomeCents = invoices.reduce((s, inv) => s + inv.paidCents, 0);

  // Fees due = total of "المجموع" as if every month were paid: monthly fee × 9.
  const monthlyTotalCents = activeFamilies.reduce((sum, f) => {
    const kids = activeStudents.filter((s) => s.familyId === f.id);
    const english = kids.filter((k) => k.englishEnrolled).length;
    return sum + assessFees(kids.length, english, settings).totalCents;
  }, 0);
  const feesDueCents = monthlyTotalCents * SCHOOL_GRID_MONTHS.length;

  // Expenses = all school المصاريف + paid الرواتب (checked months with an amount).
  const schoolExpenseCents = expenses
    .filter((e) => e.scope === "school")
    .reduce((s, e) => s + e.amountCents, 0);
  const paidSalaryCents = salaries.reduce((sum, s) => {
    const paid = s.paidCents >= s.expectedCents && s.expectedCents > 0;
    return paid ? sum + s.expectedCents : sum;
  }, 0);
  const totalExpenseCents = schoolExpenseCents + paidSalaryCents;

  const netCents = paidIncomeCents - totalExpenseCents;

  const stats: {
    label: string;
    value?: string;
    cents?: number;
  }[] = [
    { label: t.totalStudents, value: String(activeStudents.length) },
    { label: t.totalFamilies, value: String(activeFamilies.length) },
    { label: t.paidIncome, cents: paidIncomeCents },
    { label: t.feesDue, cents: feesDueCents },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-nour-gold-300/40 bg-surface p-5">
            <p className="text-sm text-muted">{s.label}</p>
            {s.cents !== undefined ? (
              <Money cents={s.cents} className="mt-2 block font-heading text-2xl font-semibold text-foreground" />
            ) : (
              <p className="mt-2 font-heading text-2xl font-semibold text-foreground">{s.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-nour-gold-500/60 bg-nour-gold-500/10 p-6">
        <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
          {t.financialSummary} 💶
        </h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-nour-gold-300/20 py-2">
            <span className="text-sm text-muted">{t.totalIncome}</span>
            <Money cents={paidIncomeCents} className="font-medium text-foreground" />
          </div>
          <div className="flex items-center justify-between border-b border-nour-gold-300/20 py-2">
            <span className="text-sm text-muted">{t.totalExpenses}</span>
            <Money cents={totalExpenseCents} className="font-medium text-foreground" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium">{t.netProfitLoss}</span>
            <Money
              cents={netCents}
              className={`font-heading text-xl font-semibold ${
                netCents < 0 ? "text-danger" : "text-success"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
