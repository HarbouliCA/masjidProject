"use client";

import { useState } from "react";
import { useMembers, usePledgeMonths } from "@/lib/data/hooks";
import { MonthGrid, type MonthGridRow } from "../MonthGrid";
import { RecordPaymentDialog, type PaymentContext } from "../RecordPaymentDialog";
import { MemberForm } from "../MemberForm";
import { MASJID_GRID_MONTHS } from "@/lib/grid";
import { exportXLSX } from "@/lib/export";
import type { Dictionary } from "@/i18n";
import type { Member } from "@/lib/schema";

export function MembersGrid({ t }: { t: Dictionary }) {
  const { data: members = [] } = useMembers();
  const { data: pledgeMonths = [] } = usePledgeMonths();
  const [context, setContext] = useState<PaymentContext | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const archivedCount = members.filter((m) => m.isActive === false).length;
  const visibleMembers = members.filter((m) =>
    showArchived ? m.isActive === false : m.isActive !== false
  );

  const rows: MonthGridRow[] = visibleMembers.map((m) => ({
    id: m.id,
    label: m.fullName + (m.isActive === false ? ` (${t.archived})` : ""),
    cells: pledgeMonths
      .filter((p) => p.memberId === m.id)
      .map((p) => ({
        month: p.month,
        expectedCents: p.expectedCents,
        paidCents: p.paidCents,
        obligationId: p.id,
      })),
  }));

  function exportGrid() {
    const header = [t.name, ...MASJID_GRID_MONTHS.map((m) => m.label)];
    const body = visibleMembers.map((m) => [
      m.fullName,
      ...MASJID_GRID_MONTHS.map((gm) => {
        const pm = pledgeMonths.find((p) => p.memberId === m.id && p.month === gm.key);
        return pm && pm.paidCents > 0 ? (pm.paidCents / 100).toString() : "";
      }),
    ]);
    exportXLSX([header, ...body], "الشرط", "الشرط.xlsx");
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          {archivedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="rounded-lg border border-nour-gold-300/60 px-4 py-2 text-sm text-muted hover:text-nour-gold-600"
            >
              {showArchived ? t.hideArchived : `${t.showArchived} (${archivedCount})`}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportGrid}
            className="rounded-lg border border-nour-gold-300/60 px-4 py-2 text-sm text-muted hover:text-nour-gold-600"
          >
            {t.export}
          </button>
          {!showArchived && (
            <button
              type="button"
              onClick={() => {
                setEditingMember(null);
                setFormOpen(true);
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              {t.add}
            </button>
          )}
        </div>
      </div>
      <MonthGrid
        months={MASJID_GRID_MONTHS}
        rows={rows}
        labelHeader={t.members}
        onLabelClick={(rowId) => {
          const member = members.find((m) => m.id === rowId) ?? null;
          setEditingMember(member);
          setFormOpen(true);
        }}
        onCellClick={(rowId, cell) => {
          const member = members.find((m) => m.id === rowId);
          setContext({
            rowLabel: member?.fullName ?? rowId,
            monthLabel:
              MASJID_GRID_MONTHS.find((m) => m.key === cell.month)?.label ??
              cell.month,
            expectedCents: cell.expectedCents,
            obligationId: cell.obligationId,
            againstType: "pledgeMonth",
            scope: "masjid",
            memberId: rowId,
          });
        }}
      />
      <RecordPaymentDialog
        t={t}
        context={context}
        onClose={() => setContext(null)}
      />
      <MemberForm
        t={t}
        open={formOpen}
        member={editingMember}
        onClose={() => setFormOpen(false)}
      />
    </>
  );
}
