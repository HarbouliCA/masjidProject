"use client";

import { useState } from "react";
import { MembersGrid } from "./MembersGrid";
import { DonationsTab } from "./DonationsTab";
import { RamadanCampaignTab } from "./RamadanCampaignTab";
import { FridayTab } from "./FridayTab";
import { ExpensesList } from "./ExpensesList";
import { TransfersList } from "./TransfersList";
import { TreasuryView } from "./TreasuryView";
import type { Dictionary } from "@/i18n";

type TabKey = "members" | "donations" | "ramadan" | "friday" | "expenses" | "transfers" | "treasury";

export function MasjidManager({ t }: { t: Dictionary }) {
  const [tab, setTab] = useState<TabKey>("members");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "members", label: t.members },
    { key: "donations", label: t.donationsAndSadaqat },
    { key: "ramadan", label: t.ramadanCampaign },
    { key: "friday", label: t.fridayBox },
    { key: "expenses", label: t.expenses },
    { key: "transfers", label: t.transfers },
    { key: "treasury", label: t.treasury },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-nour-gold-300/40">
        {tabs.map((x) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setTab(x.key)}
            className={`px-4 py-3 text-sm ${
              tab === x.key
                ? "border-b-2 border-accent font-medium text-accent"
                : "text-muted hover:text-nour-gold-600"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === "members" && <MembersGrid t={t} />}
      {tab === "donations" && <DonationsTab t={t} />}
      {tab === "ramadan" && <RamadanCampaignTab t={t} />}
      {tab === "friday" && <FridayTab t={t} />}
      {tab === "expenses" && <ExpensesList t={t} />}
      {tab === "transfers" && <TransfersList t={t} />}
      {tab === "treasury" && <TreasuryView t={t} />}
    </div>
  );
}
