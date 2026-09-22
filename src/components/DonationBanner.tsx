"use client";

import { useState } from "react";
import { ORGANIZATION } from "@/lib/organization";
import type { Dictionary } from "@/i18n";

export function DonationBanner({ t }: { t: Dictionary }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(ORGANIZATION.iban);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the IBAN stays selectable
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-nour-gold-500/60 bg-surface p-8 text-center shadow-sm">
        <h1 className="font-heading text-2xl font-semibold">{t.donate}</h1>
        <p className="mt-2 text-sm text-nour-stone-400">{ORGANIZATION.titular}</p>

        <div className="mt-6">
          <p className="text-sm text-nour-stone-400">{ORGANIZATION.concepto}</p>
          <p
            dir="ltr"
            className="mt-1 select-all font-heading text-xl font-semibold tracking-wide tabular-nums"
          >
            {ORGANIZATION.iban}
          </p>
          <button
            type="button"
            onClick={copy}
            className="mt-3 rounded-lg border border-nour-gold-500 px-4 py-2 text-sm text-nour-gold-600"
          >
            {copied ? t.copied : t.copy}
          </button>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2 border-t border-nour-gold-300/40 pt-6">
          {[t.faith, t.knowledge, t.community].map((p) => (
            <p key={p} className="text-sm text-nour-stone-400">
              {p}
            </p>
          ))}
        </div>

        <p className="mt-8 font-quranic text-xl" dir="rtl">
          {t.jazakum}
        </p>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-6 text-sm text-nour-stone-400 underline print:hidden"
        >
          {t.print}
        </button>
      </div>
    </div>
  );
}
