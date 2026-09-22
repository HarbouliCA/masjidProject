"use client";

import { useDonations } from "@/lib/data/hooks";
import { formatDate } from "@/lib/dates";
import { Money } from "../Money";
import type { Dictionary } from "@/i18n";

export function DonationsList({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useDonations();
  const sorted = [...data].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-nour-stone-400">{t.loading}</p>;
  }
  if (sorted.length === 0) {
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
            <th className="px-4 py-3 text-start font-medium">{t.date}</th>
            <th className="px-4 py-3 text-start font-medium">{t.donor}</th>
            <th className="px-4 py-3 text-start font-medium">{t.amount}</th>
            <th className="px-4 py-3 text-start font-medium">{t.channel}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d) => (
            <tr
              key={d.id}
              className="border-b border-nour-gold-300/20 last:border-0"
            >
              <td className="px-4 py-3">
                {d.date ? formatDate(new Date(`${d.date}T12:00:00Z`)) : "—"}
              </td>
              <td className="px-4 py-3">
                <span dir="auto">{d.donorName ?? d.notes ?? "—"}</span>
              </td>
              <td className="px-4 py-3">
                <Money cents={d.amountCents} />
              </td>
              <td className="px-4 py-3 text-nour-stone-400">{d.channel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
