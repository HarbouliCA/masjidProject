"use client";

import { useState, type ReactNode } from "react";
import type { Dictionary } from "@/i18n";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
}

export function DirectoryList<T extends { id: string }>({
  t,
  title,
  columns,
  rows,
  isLoading,
  searchText,
}: {
  t: Dictionary;
  title: string;
  columns: Column<T>[];
  rows: T[];
  isLoading: boolean;
  searchText: (row: T) => string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim();
  const filtered = q ? rows.filter((r) => searchText(r).includes(q)) : rows;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="font-heading text-xl font-semibold">{title}</h1>
        <input
          dir="auto"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="rounded-lg border border-nour-gold-300/60 bg-surface px-3 py-2 text-sm focus:border-nour-gold-500 focus:outline-none"
        />
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-nour-stone-400">{t.loading}</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-nour-gold-300/40 bg-surface py-12 text-center">
          <p className="text-sm text-nour-stone-400">{t.emptyState}</p>
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-nour-stone-400">
            {filtered.length} {t.results}
          </p>
          <div className="overflow-x-auto rounded-xl border border-nour-gold-300/40 bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-nour-gold-300/40 text-nour-stone-400">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className="px-4 py-3 text-start font-medium"
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-nour-gold-300/20 last:border-0"
                  >
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3">
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
