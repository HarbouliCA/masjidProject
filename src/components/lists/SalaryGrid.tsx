"use client";

import { useState } from "react";
import { useTeachers, useSalaryPayments } from "@/lib/data/hooks";
import { MonthGrid, type MonthGridRow } from "../MonthGrid";
import { RecordPaymentDialog, type PaymentContext } from "../RecordPaymentDialog";
import { SCHOOL_GRID_MONTHS } from "@/lib/grid";
import type { Dictionary } from "@/i18n";

export function SalaryGrid({ t }: { t: Dictionary }) {
  const { data: teachers = [] } = useTeachers();
  const { data: salaries = [] } = useSalaryPayments();
  const [context, setContext] = useState<PaymentContext | null>(null);

  const rows: MonthGridRow[] = teachers.map((teacher) => ({
    id: teacher.id,
    label: teacher.fullName,
    cells: salaries
      .filter((s) => s.teacherId === teacher.id)
      .map((s) => ({
        month: s.month,
        expectedCents: s.expectedCents,
        paidCents: s.paidCents,
        obligationId: s.id,
      })),
  }));

  return (
    <>
      <MonthGrid
        months={SCHOOL_GRID_MONTHS}
        rows={rows}
        labelHeader={t.teacher}
        onCellClick={(rowId, cell, monthKey) => {
          const teacher = teachers.find((x) => x.id === rowId);
          setContext({
            rowLabel: teacher?.fullName ?? rowId,
            monthLabel:
              SCHOOL_GRID_MONTHS.find((m) => m.key === monthKey)?.label ??
              monthKey,
            monthKey: monthKey,
            expectedCents: cell ? cell.expectedCents : 0,
            currentPaidCents: cell?.paidCents ?? 0,
            obligationId: cell?.obligationId ?? "",
            againstType: "invoice",
            scope: "school",
          });
        }}
      />
      <RecordPaymentDialog
        t={t}
        context={context}
        onClose={() => setContext(null)}
      />
    </>
  );
}
