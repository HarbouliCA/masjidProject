"use client";

import { useState } from "react";
import { SchoolDashboardTab } from "./SchoolDashboardTab";
import { FamiliesTab } from "./FamiliesTab";
import { StudentsTab } from "./StudentsTab";
import { ClassesTab } from "./ClassesTab";
import { TeachersTab } from "./TeachersTab";
import { SalaryCalendar } from "./SalaryCalendar";
import { InvoicesCalendar } from "./InvoicesCalendar";
import { SchoolExpensesTab } from "./SchoolExpensesTab";
import { TransfersList } from "./TransfersList";
import type { Dictionary } from "@/i18n";

type TabKey = "overview" | "families" | "students" | "classes" | "invoices" | "teachers" | "salary" | "expenses" | "transfers";

export function SchoolManager({ t }: { t: Dictionary }) {
  const [tab, setTab] = useState<TabKey>("overview");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: t.dashboard },
    { key: "families", label: t.families },
    { key: "students", label: t.students },
    { key: "classes", label: t.classes },
    { key: "invoices", label: t.invoices ?? "الرسوم" },
    { key: "teachers", label: t.teachers },
    { key: "salary", label: t.salary },
    { key: "expenses", label: t.schoolExpenses },
    { key: "transfers", label: t.transfers },
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

      {tab === "overview" && <SchoolDashboardTab t={t} />}
      {tab === "families" && <FamiliesTab t={t} />}
      {tab === "students" && <StudentsTab t={t} />}
      {tab === "classes" && <ClassesTab t={t} />}
      {tab === "invoices" && <InvoicesCalendar t={t} />}
      {tab === "teachers" && <TeachersTab t={t} />}
      {tab === "salary" && <SalaryCalendar t={t} />}
      {tab === "expenses" && <SchoolExpensesTab t={t} />}
      {tab === "transfers" && <TransfersList t={t} perspective="school" />}
    </div>
  );
}
