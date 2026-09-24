"use client";

import { useMemo } from "react";
import {
  useMembers,
  usePledgeMonths,
  useDonations,
  useExpenses,
  useStudents,
  useFamilies,
  useTeachers,
  useClasses,
  useInvoices,
  useSalaryPayments,
} from "@/lib/data/hooks";
import { Money } from "./Money";
import type { Dictionary } from "@/i18n";

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-nour-gold-300/30 bg-nour-gold-300/5 p-4 transition-colors hover:border-nour-gold-500/50">
      <p className="text-xs text-muted">{label}</p>
      <div className="mt-1 font-heading text-xl font-semibold text-foreground">
        {children}
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: React.ReactNode;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-medium text-foreground">{value}</span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-nour-gold-300/20">
        <div
          className={`h-full rounded-full ${color} transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-5 w-1 rounded-full bg-nour-gold-500" />
      <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
    </div>
  );
}

export function DashboardView({ t }: { t: Dictionary }) {
  const { data: members = [] } = useMembers();
  const { data: pledgeMonths = [] } = usePledgeMonths();
  const { data: donations = [] } = useDonations();
  const { data: expenses = [] } = useExpenses();
  const { data: students = [] } = useStudents();
  const { data: families = [] } = useFamilies();
  const { data: teachers = [] } = useTeachers();
  const { data: classes = [] } = useClasses();
  const { data: invoices = [] } = useInvoices();
  const { data: salaries = [] } = useSalaryPayments();

  const masjid = useMemo(() => {
    const activeMembers = members.filter((m) => m.isActive !== false);
    const pledges = sum(pledgeMonths.map((p) => p.paidCents));
    const donationsTotal = sum(
      donations
        .filter((d) => d.channel !== "ramadan_campaign" && d.isActive !== false)
        .map((d) => d.amountCents)
    );
    const income = pledges + donationsTotal;
    const expense = sum(
      expenses
        .filter((e) => e.scope === "masjid" && e.isActive !== false)
        .map((e) => e.amountCents)
    );
    return { members: activeMembers.length, income, expense, net: income - expense };
  }, [members, pledgeMonths, donations, expenses]);

  const school = useMemo(() => {
    const activeStudents = students.filter((s) => s.isActive !== false);
    const activeFamilies = families.filter((f) => f.isActive !== false);
    const activeTeachers = teachers.filter((x) => x.isActive !== false);
    const activeClasses = classes.filter((c) => c.isActive !== false);
    const income = sum(invoices.map((i) => i.paidCents));
    const expenseBase = sum(
      expenses
        .filter((e) => e.scope === "school" && e.isActive !== false)
        .map((e) => e.amountCents)
    );
    const paidSalaries = sum(
      salaries
        .filter((s) => s.paidCents >= s.expectedCents && s.expectedCents > 0)
        .map((s) => s.expectedCents)
    );
    const expense = expenseBase + paidSalaries;
    return {
      students: activeStudents.length,
      families: activeFamilies.length,
      teachers: activeTeachers.length,
      classes: activeClasses.length,
      income,
      expense,
      net: income - expense,
    };
  }, [students, families, teachers, classes, invoices, expenses, salaries]);

  const financeBars = [
    { label: `${t.masjid} · ${t.revenue}`, value: masjid.income, color: "bg-success" },
    { label: `${t.masjid} · ${t.expenses}`, value: masjid.expense, color: "bg-nour-gold-500" },
    { label: `${t.school} · ${t.revenue}`, value: school.income, color: "bg-success" },
    { label: `${t.school} · ${t.expenses}`, value: school.expense, color: "bg-nour-gold-500" },
  ];
  const financeMax = Math.max(...financeBars.map((b) => b.value), 0);

  const schoolBars = [
    { label: t.students, value: school.students, color: "bg-nour-gold-500" },
    { label: t.teachers, value: school.teachers, color: "bg-success" },
    { label: t.classes, value: school.classes, color: "bg-nour-gold-300" },
  ];
  const schoolMax = Math.max(...schoolBars.map((b) => b.value), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* المسجد */}
        <section className="rounded-xl border border-nour-gold-300/40 bg-surface p-6 transition-shadow hover:shadow-sm">
          <SectionHeading title={t.masjid} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label={t.revenue}>
              <Money cents={masjid.income} />
            </Stat>
            <Stat label={t.expenses}>
              <Money cents={masjid.expense} />
            </Stat>
            <Stat label={t.members}>{masjid.members}</Stat>
            <Stat label={t.net}>
              <Money
                cents={masjid.net}
                className={masjid.net < 0 ? "text-danger" : "text-success"}
              />
            </Stat>
          </div>
        </section>

        {/* المدرسة */}
        <section className="rounded-xl border border-nour-gold-300/40 bg-surface p-6 transition-shadow hover:shadow-sm">
          <SectionHeading title={t.school} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label={t.students}>{school.students}</Stat>
            <Stat label={t.families}>{school.families}</Stat>
            <Stat label={t.revenue}>
              <Money cents={school.income} />
            </Stat>
            <Stat label={t.net}>
              <Money
                cents={school.net}
                className={school.net < 0 ? "text-danger" : "text-success"}
              />
            </Stat>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* الإيرادات والمصاريف */}
        <section className="rounded-xl border border-nour-gold-300/40 bg-surface p-6 transition-shadow hover:shadow-sm">
          <SectionHeading title={t.incomeVsExpenses} />
          <div className="mt-5 space-y-4">
            {financeBars.map((b) => (
              <Bar
                key={b.label}
                label={b.label}
                value={<Money cents={b.value} />}
                pct={financeMax > 0 ? (b.value / financeMax) * 100 : 0}
                color={b.color}
              />
            ))}
          </div>
        </section>

        {/* الطلاب والمعلمون والفصول */}
        <section className="rounded-xl border border-nour-gold-300/40 bg-surface p-6 transition-shadow hover:shadow-sm">
          <SectionHeading title={t.studentsTeachersClasses} />
          <div className="mt-5 space-y-4">
            {schoolBars.map((b) => (
              <Bar
                key={b.label}
                label={b.label}
                value={<span className="tabular-nums">{b.value}</span>}
                pct={schoolMax > 0 ? (b.value / schoolMax) * 100 : 0}
                color={b.color}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
