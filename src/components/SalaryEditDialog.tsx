"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { upsertSalaryPayment } from "@/lib/crud";
import { Field, inputClass, buttonClass, ghostButtonClass } from "./forms/shared";
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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (context) {
      setAmount(
        context.payment ? (context.payment.expectedCents / 100).toString() : ""
      );
    }
  }, [context]);

  if (!context) return null;
  const ctx = context;

  async function submit() {
    const cents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) return;
    await upsertSalaryPayment({
      teacherId: ctx.teacherId,
      month: ctx.month,
      expectedCents: cents,
      paidCents: ctx.payment?.paidCents ?? 0,
      paidAt: ctx.payment?.paidAt,
      notes: ctx.payment?.notes ?? "",
    });
    queryClient.invalidateQueries();
    onClose();
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
          {ctx.payment ? t.editSalary : t.addSalary}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {ctx.teacherName} · {ctx.monthLabel}
        </p>

        <div className="mt-4">
          <Field label={t.salary}>
            <input
              dir="ltr"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ghostButtonClass}>
            {t.cancel}
          </button>
          <button type="button" onClick={submit} className={buttonClass}>
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
