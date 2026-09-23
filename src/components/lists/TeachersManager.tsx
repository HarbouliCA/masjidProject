"use client";

import { useState } from "react";
import { TeachersTab } from "./TeachersTab";
import { SalaryCalendar } from "./SalaryCalendar";
import type { Dictionary } from "@/i18n";

type TabKey = "teachers" | "salary";

export function TeachersManager({ t }: { t: Dictionary }) {
  const [tab, setTab] = useState<TabKey>("teachers");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "teachers", label: t.teachers },
    { key: "salary", label: t.salary },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-nour-gold-300/40">
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

      {tab === "teachers" && <TeachersTab t={t} />}
      {tab === "salary" && <SalaryCalendar t={t} />}
    </div>
  );
}
