"use client";

import { useAuditLog } from "@/lib/data/hooks";
import type { Dictionary } from "@/i18n";

export function AuditLogView({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useAuditLog();
  const sorted = [...data].sort((a, b) => b.at.localeCompare(a.at));

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-nour-stone-400">{t.loading}</p>;
  }
  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-nour-gold-300/40 bg-surface py-12 text-center">
        <p className="text-sm text-nour-stone-400">{t.emptyState}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-nour-gold-300/40 bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-nour-gold-300/40 text-nour-stone-400">
            <th className="px-4 py-3 text-start font-medium">{t.date}</th>
            <th className="px-4 py-3 text-start font-medium">{t.actions}</th>
            <th className="px-4 py-3 text-start font-medium">{t.description}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr key={a.id} className="border-b border-nour-gold-300/20 last:border-0">
              <td className="px-4 py-3 text-nour-stone-400">
                {new Date(a.at).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <span dir="auto">{a.action}</span>
              </td>
              <td className="px-4 py-3">
                <span dir="auto">{a.what}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
