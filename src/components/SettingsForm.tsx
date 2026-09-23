"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSettings } from "@/lib/data/hooks";
import { updateSettings } from "@/lib/crud";
import { Field, inputClass, buttonClass } from "./forms/shared";
import type { Dictionary } from "@/i18n";

export function SettingsForm({ t }: { t: Dictionary }) {
  const { data: settings } = useSettings();
  const queryClient = useQueryClient();
  const [oneChild, setOneChild] = useState("20");
  const [twoChildren, setTwoChildren] = useState("18");
  const [threePlus, setThreePlus] = useState("15");
  const [english, setEnglish] = useState("10");
  const [iban, setIban] = useState("");
  const [titular, setTitular] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setOneChild((settings.pricing.oneChild / 100).toString());
    setTwoChildren((settings.pricing.twoChildren / 100).toString());
    setThreePlus((settings.pricing.threePlusChildren / 100).toString());
    setEnglish((settings.pricing.englishPerChild / 100).toString());
    setIban(settings.organization.iban);
    setTitular(settings.organization.titular);
  }, [settings]);

  async function submit() {
    const num = (s: string) => Math.round(Number(s) * 100);
    await updateSettings({
      pricing: {
        oneChild: num(oneChild),
        twoChildren: num(twoChildren),
        threePlusChildren: num(threePlus),
        englishPerChild: num(english),
      },
      organization: {
        iban: iban.trim(),
        titular: titular.trim(),
        concepto: settings?.organization.concepto ?? "DONACIÓN",
        fiscalYear: settings?.organization.fiscalYear ?? "2026",
        openingBalances: settings?.organization.openingBalances ?? { masjid: 0, school: 0 },
      },
    });
    queryClient.invalidateQueries();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-nour-gold-300/40 bg-surface p-6">
        <h2 className="mb-3 font-heading text-lg font-semibold">{t.settings}</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="(طفل واحد)">
            <input dir="ltr" inputMode="decimal" value={oneChild} onChange={(e) => setOneChild(e.target.value)} className={inputClass} />
          </Field>
          <Field label="(طفلان)">
            <input dir="ltr" inputMode="decimal" value={twoChildren} onChange={(e) => setTwoChildren(e.target.value)} className={inputClass} />
          </Field>
          <Field label="(3+ أطفال)">
            <input dir="ltr" inputMode="decimal" value={threePlus} onChange={(e) => setThreePlus(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t.english}>
            <input dir="ltr" inputMode="decimal" value={english} onChange={(e) => setEnglish(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="IBAN">
            <input dir="ltr" value={iban} onChange={(e) => setIban(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t.name}>
            <input dir="auto" value={titular} onChange={(e) => setTitular(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={submit} className={buttonClass}>
            {t.save}
          </button>
          {saved && <span className="text-sm text-success">{t.saved}</span>}
        </div>
      </div>
    </div>
  );
}
