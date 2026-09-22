"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAnnouncements } from "@/lib/data/hooks";
import { recordAnnouncement } from "@/lib/mutations";
import { formatDate } from "@/lib/dates";
import type { Dictionary } from "@/i18n";

export function AnnouncementsList({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useAnnouncements();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const sorted = [...data].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  async function submit() {
    if (!title.trim() || !body.trim()) return;
    await recordAnnouncement({ title: title.trim(), body: body.trim() });
    queryClient.invalidateQueries();
    setTitle("");
    setBody("");
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
        <div className="space-y-2 rounded-xl border border-nour-gold-300/40 bg-surface p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.event}
            className="w-full rounded-lg border border-nour-gold-300/60 bg-surface px-3 py-2"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-nour-gold-300/60 bg-surface px-3 py-2"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={submit}
              className="rounded-lg bg-nour-green-900 px-4 py-2 text-sm text-nour-cream-50 dark:bg-nour-gold-500 dark:text-nour-green-900"
            >
              {t.save}
            </button>
          </div>
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
          {sorted.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-nour-gold-300/40 bg-surface p-4"
            >
              <div className="flex items-center justify-between">
                <span dir="auto" className="font-medium">{a.title}</span>
                <span className="text-xs text-nour-stone-400">
                  {formatDate(new Date(a.publishedAt))}
                </span>
              </div>
              <p dir="auto" className="mt-1 text-sm text-nour-stone-400">{a.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
