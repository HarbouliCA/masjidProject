"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTransfers } from "@/lib/data/hooks";
import { recordTransfer } from "@/lib/mutations";
import { formatDate } from "@/lib/dates";
import { Money } from "../Money";
import type { Dictionary } from "@/i18n";

export function TransfersList({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useTransfers();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");

  async function submit() {
    const cents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) return;
    await recordTransfer({
      fromScope: "school",
      toScope: "masjid",
      amountCents: cents,
    });
    queryClient.invalidateQueries();
    setAmount("");
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-nour-green-900 px-4 py-2 text-sm text-nour-cream-50 dark:bg-nour-gold-500 dark:text-nour-green-900"
        >
          {t.add}
        </button>
      </div>

      {showForm && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-nour-gold-300/40 bg-surface p-4">
          <span className="text-sm text-nour-stone-400">
            {t.school} ← {t.masjid}
          </span>
          <label className="w-32">
            <span className="text-sm text-nour-stone-400">{t.amount}</span>
            <input
              dir="ltr"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-nour-gold-300/60 bg-surface px-3 py-2 text-end tabular-nums"
            />
          </label>
          <button
            type="button"
            onClick={submit}
            className="rounded-lg bg-nour-green-900 px-4 py-2 text-sm text-nour-cream-50 dark:bg-nour-gold-500 dark:text-nour-green-900"
          >
            {t.save}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-nour-stone-400">{t.loading}</p>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-nour-gold-300/40 bg-surface py-12 text-center">
          <p className="text-sm text-nour-stone-400">{t.emptyState}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nour-gold-300/40 bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-nour-gold-300/40 text-nour-stone-400">
                <th className="px-4 py-3 text-start font-medium">{t.date}</th>
                <th className="px-4 py-3 text-start font-medium">{t.transfers}</th>
                <th className="px-4 py-3 text-start font-medium">{t.amount}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((tr) => (
                <tr key={tr.id} className="border-b border-nour-gold-300/20 last:border-0">
                  <td className="px-4 py-3">
                    {tr.date ? formatDate(new Date(`${tr.date}T12:00:00Z`)) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span dir="auto">{tr.fromScope} → {tr.toScope}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Money cents={tr.amountCents} />
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
