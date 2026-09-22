"use client";

import {
  useDonations,
  useExpenses,
  usePledgeMonths,
  usePayments,
  useTransfers,
} from "@/lib/data/hooks";
import { computeTreasury } from "@/lib/treasury";
import { isRamadan } from "@/lib/hijri";
import { Money } from "./Money";
import type { Dictionary } from "@/i18n";

export function DashboardView({ t }: { t: Dictionary }) {
  const { data: pledgeMonths = [] } = usePledgeMonths();
  const { data: donations = [] } = useDonations();
  const { data: payments = [] } = usePayments();
  const { data: expenses = [] } = useExpenses();
  const { data: transfers = [] } = useTransfers();

  const treasury = computeTreasury({ pledgeMonths, donations, payments, expenses, transfers });
  const fridayTotal = donations
    .filter((d) => d.channel === "friday_box")
    .reduce((s, d) => s + d.amountCents, 0);
  const ramadan = isRamadan(new Date());

  const kpis = [
    { label: t.donations, cents: donations.reduce((s, d) => s + d.amountCents, 0) },
    { label: t.fridayBox, cents: fridayTotal },
    { label: t.expenses, cents: treasury.consolidated.expensesCents },
    { label: t.balance, cents: treasury.consolidated.netCents },
  ];

  return (
    <div className="space-y-8">
      {ramadan && (
        <section className="rounded-xl border border-nour-gold-500/60 bg-nour-gold-500/10 p-6">
          <h2 className="font-heading text-lg font-semibold text-nour-gold-600">
            {t.ramadan}
          </h2>
          <p className="mt-1 text-sm text-nour-stone-400">{t.fridayBox}</p>
        </section>
      )}

      <section>
        <h2 className="mb-4 font-heading text-lg font-semibold">{t.overview}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-nour-gold-300/40 bg-surface p-5"
            >
              <p className="text-sm text-nour-stone-400">{kpi.label}</p>
              <Money
                cents={kpi.cents}
                className="mt-2 block font-heading text-2xl font-semibold text-nour-green-900 dark:text-nour-cream-50"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
