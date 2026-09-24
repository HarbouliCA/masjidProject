"use client";

import { useEffect, useState } from "react";
import { upsertSalaryPayment } from "@/lib/crud";
import { Field, inputClass, buttonClass, ghostButtonClass } from "./forms/shared";
import { useSubmit } from "./forms/useSubmit";
import { parseEURToCents } from "@/lib/money";
import type { Dictionary } from "@/i18n";
import type { SalaryPayment } from "@/lib/schema";

export interface SalaryEditContext {
  teacherId: string;
  teacherName: string;
  month: string;
  monthLabel: string;
  payment: SalaryPayment | null;
}

export function SalaryEditDialog({
  t,
  context,
  onClose,
}: {
  t: Dictionary;
  context: SalaryEditContext | null;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const { busy, error, saved, runAndInvalidate } = useSubmit();

  useEffect(() => {
    if (context) {
      setAmount(
        context.payment && context.payment.expectedCents > 0
          ? (context.payment.expectedCents / 100).toString()
          : ""
      );
    }
  }, [context]);

  if (!context) return null;
  const ctx = context;

  async function submit() {
    const cents = parseEURToCents(amount);
    if (!Number.isFinite(cents) || cents < 0) return;
    await runAndInvalidate(async () => {
      await upsertSalaryPayment({
        teacherId: ctx.teacherId,
        month: ctx.month,
        expectedCents: cents,
        paidCents: ctx.payment?.paidCents ?? 0,
        paidAt: ctx.payment?.paidAt,
        notes: ctx.payment?.notes ?? "",
      });
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <h2 className="font-heading text-lg font-semibold">
          {ctx.payment && ctx.payment.expectedCents > 0 ? t.editSalary : t.addSalary}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {ctx.teacherName} · {ctx.monthLabel}
        </p>

        <div className="mt-4 space-y-3">
          <Field label={t.salary}>
            <input
              dir="ltr"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
            />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {saved && <span className="text-sm text-success">{t.saved}</span>}
          <button type="button" onClick={onClose} className={ghostButtonClass}>
            {t.cancel}
          </button>
          <button type="button" onClick={submit} disabled={busy} className={buttonClass}>
            {busy ? t.saving : t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
