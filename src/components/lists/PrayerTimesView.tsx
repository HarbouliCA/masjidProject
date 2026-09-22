"use client";

import { usePrayerTimes } from "@/lib/data/hooks";
import { formatDate } from "@/lib/dates";
import type { Dictionary, TranslationKey } from "@/i18n";

const PRAYERS: { key: TranslationKey; field: keyof PrayerTimesRow }[] = [
  { key: "fajr", field: "fajr" },
  { key: "dhuhr", field: "dhuhr" },
  { key: "asr", field: "asr" },
  { key: "maghrib", field: "maghrib" },
  { key: "isha", field: "isha" },
];

type PrayerTimesRow = {
  date: string;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
};

export function PrayerTimesView({ t }: { t: Dictionary }) {
  const { data = [] } = usePrayerTimes();
  const today = new Date().toISOString().slice(0, 10);
  const row = (data as PrayerTimesRow[]).find((p) => p.date === today);

  return (
    <div className="rounded-xl border border-nour-gold-300/40 bg-surface p-6">
      {row ? (
        <>
          <p className="mb-4 text-sm text-nour-stone-400">
            {formatDate(new Date(`${row.date}T12:00:00Z`))}
          </p>
          <ul className="space-y-2">
            {PRAYERS.map((p) => (
              <li key={p.key} className="flex items-center justify-between">
                <span className="font-medium">{t[p.key]}</span>
                <span dir="ltr" className="tabular-nums text-nour-stone-400">
                  {row[p.field]}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="py-8 text-center text-sm text-nour-stone-400">{t.emptyState}</p>
      )}
    </div>
  );
}
