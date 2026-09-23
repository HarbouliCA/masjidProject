"use client";

import { ghostButtonClass } from "./forms/shared";
import type { Dictionary } from "@/i18n";

export function ConfirmDialog({
  t,
  open,
  title,
  message,
  busy = false,
  onConfirm,
  onCancel,
}: {
  t: Dictionary;
  open: boolean;
  title: string;
  message: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted" dir="auto">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={ghostButtonClass}>
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-danger px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy ? t.saving : t.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
