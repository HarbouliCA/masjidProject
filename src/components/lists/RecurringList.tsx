"use client";

import { useCollection } from "@/lib/data/hooks";
import { Money } from "../Money";
import type { Dictionary } from "@/i18n";
import type { RecurringExpense } from "@/lib/schema";

export function RecurringList({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useCollection<RecurringExpense>("recurringExpenses");

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-nour-stone-400">{t.loading}</p>;
  }
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-nour-gold-300/40 bg-surface py-12 text-center">
        <p className="text-sm text-nour-stone-400">{t.emptyState}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-nour-gold-300/40 bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-nour-gold-300/40 text-nour-stone-400">
            <th className="px-4 py-3 text-start font-medium">{t.description}</th>
            <th className="px-4 py-3 text-start font-medium">{t.amount}</th>
            <th className="px-4 py-3 text-start font-medium">{t.status}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.id} className="border-b border-nour-gold-300/20 last:border-0">
              <td className="px-4 py-3">
                <span dir="auto">{r.label}</span>
                <span className="ms-2 text-xs text-nour-stone-400">{r.frequency}</span>
              </td>
              <td className="px-4 py-3">
                <Money cents={r.amountCents} />
              </td>
              <td className="px-4 py-3 text-nour-stone-400">
                {r.autoCreate ? t.status_active : t.status_lapsed}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
