"use client";

import { useState } from "react";
import { FamiliesTab } from "./FamiliesTab";
import { StudentsTab } from "./StudentsTab";
import { ClassesTab } from "./ClassesTab";
import type { Dictionary } from "@/i18n";

type TabKey = "families" | "students" | "classes";

export function SchoolManager({ t }: { t: Dictionary }) {
  const [tab, setTab] = useState<TabKey>("families");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "families", label: t.families },
    { key: "students", label: t.students },
    { key: "classes", label: t.classes },
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

      {tab === "families" && <FamiliesTab t={t} />}
      {tab === "students" && <StudentsTab t={t} />}
      {tab === "classes" && <ClassesTab t={t} />}
    </div>
  );
}
