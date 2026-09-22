"use client";

import {
  usePledgeMonths,
  useDonations,
  usePayments,
  useExpenses,
  useTransfers,
} from "@/lib/data/hooks";
import { computeTreasury, type ScopeLedger } from "@/lib/treasury";
import { Money } from "../Money";
import type { Dictionary } from "@/i18n";

function Row({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex items-center justify-between border-b border-nour-gold-300/20 py-2 last:border-0">
      <span className="text-sm text-nour-stone-400">{label}</span>
      <Money cents={cents} className="font-medium" />
    </div>
  );
}

function ScopeCard({
  t,
  title,
  ledger,
  transferLabel,
  transferCents,
}: {
  t: Dictionary;
  title: string;
  ledger: ScopeLedger;
  transferLabel: string;
  transferCents: number;
}) {
  return (
    <div className="rounded-xl border border-nour-gold-300/40 bg-surface p-5">
      <h3 className="mb-3 font-heading text-lg font-semibold">{title}</h3>
      <Row label={t.income} cents={ledger.incomeCents} />
      <Row label={t.expenses} cents={ledger.expensesCents} />
      <Row label={transferLabel} cents={transferCents} />
      <div className="flex items-center justify-between pt-3">
        <span className="text-sm font-medium">{t.net}</span>
        <Money cents={ledger.netCents} className="font-heading text-xl font-semibold" />
      </div>
    </div>
  );
}

export function TreasuryView({ t }: { t: Dictionary }) {
  const { data: pledgeMonths = [] } = usePledgeMonths();
  const { data: donations = [] } = useDonations();
  const { data: payments = [] } = usePayments();
  const { data: expenses = [] } = useExpenses();
  const { data: transfers = [] } = useTransfers();

  const treasury = computeTreasury({ pledgeMonths, donations, payments, expenses, transfers });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ScopeCard
        t={t}
        title={t.masjid}
        ledger={treasury.masjid}
        transferLabel={t.transfers}
        transferCents={treasury.masjid.transfersInCents}
      />
      <ScopeCard
        t={t}
        title={t.school}
        ledger={treasury.school}
        transferLabel={t.transfers}
        transferCents={-treasury.school.transfersOutCents}
      />
      <div className="rounded-xl border border-nour-gold-500/60 bg-nour-gold-500/5 p-5 dark:bg-nour-green-700">
        <h3 className="mb-3 font-heading text-lg font-semibold">{t.consolidated}</h3>
        <Row label={t.income} cents={treasury.consolidated.incomeCents} />
        <Row label={t.expenses} cents={treasury.consolidated.expensesCents} />
        <div className="flex items-center justify-between pt-3">
          <span className="text-sm font-medium">{t.net}</span>
          <Money
            cents={treasury.consolidated.netCents}
            className="font-heading text-xl font-semibold text-nour-gold-600"
          />
        </div>
      </div>
    </div>
  );
}
