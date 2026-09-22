"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEvents } from "@/lib/data/hooks";
import { recordEvent } from "@/lib/mutations";
import { formatDate } from "@/lib/dates";
import type { Dictionary } from "@/i18n";

export function EventsList({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useEvents();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  const sorted = [...data].sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));

  async function submit() {
    if (!title.trim() || !date) return;
    await recordEvent({
      title: title.trim(),
      description: "",
      start: `${date}T12:00:00`,
      location: location.trim() || undefined,
    });
    queryClient.invalidateQueries();
    setTitle("");
    setDate("");
    setLocation("");
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-nour-green-900 px-4 py-2 text-sm text-nour-cream-50 dark:bg-nour-gold-500 dark:text-nour-green-900"
        >
          {t.add}
        </button>
      </div>

      {showForm && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-nour-gold-300/40 bg-surface p-4">
          <label className="grow">
            <span className="text-sm text-nour-stone-400">{t.event}</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-nour-gold-300/60 bg-surface px-3 py-2"
            />
          </label>
          <label>
            <span className="text-sm text-nour-stone-400">{t.date}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 rounded-lg border border-nour-gold-300/60 bg-surface px-3 py-2"
            />
          </label>
          <label>
            <span className="text-sm text-nour-stone-400">{t.location}</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 rounded-lg border border-nour-gold-300/60 bg-surface px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={submit}
            className="rounded-lg bg-nour-green-900 px-4 py-2 text-sm text-nour-cream-50 dark:bg-nour-gold-500 dark:text-nour-green-900"
          >
            {t.save}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-nour-stone-400">{t.loading}</p>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-nour-gold-300/40 bg-surface py-12 text-center">
          <p className="text-sm text-nour-stone-400">{t.emptyState}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((e) => (
            <li
              key={e.id}
              className="rounded-xl border border-nour-gold-300/40 bg-surface p-4"
            >
              <div className="flex items-center justify-between">
                <span dir="auto" className="font-medium">{e.title}</span>
                <span className="text-sm text-nour-stone-400">
                  {e.start ? formatDate(new Date(e.start)) : "—"}
                </span>
              </div>
              {e.location && (
                <p className="mt-1 text-sm text-nour-stone-400">{e.location}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
