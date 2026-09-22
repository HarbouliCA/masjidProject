"use client";

import { useDonations } from "@/lib/data/hooks";
import { generateFridays } from "@/lib/fridays";
import { formatDate } from "@/lib/dates";
import { formatHijri } from "@/lib/hijri";
import { Money } from "../Money";
import type { Dictionary } from "@/i18n";

/**
 * Friday-box tracker (plan §9.3.3): every Jumuah of the fiscal year, Hijri-aware.
 * A Friday with an entry shows its amount; a missing entry is an amber gap;
 * Eid Fridays are annotated and expected-zero.
 */
export function FridayTracker({ t }: { t: Dictionary }) {
  const { data: donations = [] } = useDonations();
  const byDate = new Map(
    donations
      .filter((d) => d.channel === "friday_box")
      .map((d) => [d.date, d])
  );
  const fridays = generateFridays("2026-01-01", "2026-12-31");

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {fridays.map((f) => {
        const d = new Date(`${f.date}T12:00:00Z`);
        const entry = byDate.get(f.date);
        const cardClass = f.eid
          ? "border-nour-gold-500 bg-nour-gold-500/10"
          : entry
            ? "border-nour-gold-300/40 bg-surface"
            : "border-warning/40 bg-warning/10";
        return (
          <div
            key={f.date}
            className={`rounded-xl border p-3 text-center ${cardClass}`}
          >
            <p className="text-xs text-nour-stone-400">{formatDate(d)}</p>
            <p className="text-[0.65rem] text-nour-stone-400">{formatHijri(d)}</p>
            {f.eid ? (
              <p className="mt-1 text-xs font-medium text-nour-gold-600">
                {f.eid === "fitr" ? t.eidFitr : t.eidAdha}
              </p>
            ) : entry ? (
              <Money
                cents={entry.amountCents}
                className="mt-1 block text-sm font-semibold text-success"
              />
            ) : (
              <p className="mt-1 text-sm text-warning">—</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
