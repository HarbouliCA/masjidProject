"use client";

import { useState } from "react";
import { useFamilies, useInvoices } from "@/lib/data/hooks";
import { MonthGrid, type MonthGridRow } from "../MonthGrid";
import { RecordPaymentDialog, type PaymentContext } from "../RecordPaymentDialog";
import { SCHOOL_GRID_MONTHS } from "@/lib/grid";
import type { Dictionary } from "@/i18n";

export function InvoicesGrid({ t }: { t: Dictionary }) {
  const { data: families = [] } = useFamilies();
  const { data: invoices = [] } = useInvoices();
  const [context, setContext] = useState<PaymentContext | null>(null);

  const rows: MonthGridRow[] = families.map((f) => ({
    id: f.id,
    label: f.parentName,
    cells: invoices
      .filter((inv) => inv.familyId === f.id)
      .map((inv) => ({
        month: inv.month,
        expectedCents: inv.totalCents,
        paidCents: inv.paidCents,
        obligationId: inv.id,
      })),
  }));

  return (
    <>
      <MonthGrid
        months={SCHOOL_GRID_MONTHS}
        rows={rows}
        labelHeader={t.families}
        onCellClick={(rowId, cell) => {
          const family = families.find((f) => f.id === rowId);
          setContext({
            rowLabel: family?.parentName ?? rowId,
            monthLabel:
              SCHOOL_GRID_MONTHS.find((m) => m.key === cell.month)?.label ??
              cell.month,
            expectedCents: cell.expectedCents,
            obligationId: cell.obligationId,
            againstType: "invoice",
            scope: "school",
            familyId: rowId,
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
