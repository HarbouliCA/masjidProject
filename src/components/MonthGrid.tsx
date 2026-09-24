import { Money } from "./Money";
import { deriveObligationStatus, type ObligationStatus } from "@/lib/ledger";
import type { Cents } from "@/lib/schema";

export interface MonthCell {
  month: string; // "2026-01"
  expectedCents: Cents;
  paidCents: Cents;
  waived?: boolean;
  obligationId: string; // the invoice/pledgeMonth document id
}

export interface MonthGridRow {
  id: string;
  label: string;
  cells: MonthCell[];
}

const statusClass: Record<ObligationStatus, string> = {
  paid: "bg-success/15 text-success dark:text-green-300",
  partial: "bg-warning/15 text-warning dark:text-yellow-300",
  unpaid: "text-nour-stone-400 dark:text-gray-400",
  waived: "text-nour-stone-400 dark:text-gray-400",
};

/**
 * The ⭐ shared MonthGrid — one component, two books (plan §9.3.1 / §9.2).
 * Rows are members (masjid الشرط) or families (school invoices); columns are
 * months. Under dir="rtl" the first month (يناير/أكتوبر) is the rightmost
 * column, so the calendar flows right→left naturally — no manual mirroring.
 */
export function MonthGrid({
  months,
  rows,
  labelHeader,
  onCellClick,
  onLabelClick,
}: {
  months: { key: string; label: string }[];
  rows: MonthGridRow[];
  labelHeader: string;
  onCellClick?: (rowId: string, cell: MonthCell | null, monthKey: string) => void;
  onLabelClick?: (rowId: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-nour-gold-300/40 bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-nour-gold-300/40">
            <th className="sticky inset-inline-start-0 bg-surface px-4 py-3 text-start font-medium text-nour-stone-400">
              {labelHeader}
            </th>
            {months.map((m) => (
              <th
                key={m.key}
                className="px-2 py-3 text-center font-medium text-nour-stone-400"
              >
                {m.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-nour-gold-300/20 last:border-0"
            >
              <td className="sticky inset-inline-start-0 bg-surface px-4 py-2 font-medium">
                {onLabelClick ? (
                  <button
                    type="button"
                    onClick={() => onLabelClick(row.id)}
                    className="text-start hover:text-nour-gold-600"
                  >
                    <span dir="auto">{row.label}</span>
                  </button>
                ) : (
                  <span dir="auto">{row.label}</span>
                )}
              </td>
              {months.map((m) => {
                const cell = row.cells.find((c) => c.month === m.key);
                if (!cell) {
                  return (
                    <td
                      key={m.key}
                      className="px-2 py-2 text-center text-nour-stone-400"
                    >
                      <button
                        type="button"
                        onClick={() => onCellClick?.(row.id, null, m.key)}
                        className="inline-block min-w-[3.5rem] rounded px-2 py-1 tabular-nums hover:bg-nour-gold-300/10 dark:hover:bg-nour-green-700"
                      >
                        ·
                      </button>
                    </td>
                  );
                }
                const status = deriveObligationStatus(
                  cell.expectedCents,
                  cell.paidCents,
                  cell.waived
                );
                return (
                  <td key={m.key} className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onCellClick?.(row.id, cell, m.key)}
                      className={`inline-block min-w-[3.5rem] rounded px-2 py-1 tabular-nums ${statusClass[status]}`}
                    >
                      {cell.paidCents > 0 ? (
                        <Money cents={cell.paidCents} />
                      ) : (
                        "—"
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
