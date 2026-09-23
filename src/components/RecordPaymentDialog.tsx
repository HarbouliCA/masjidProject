"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firestore/client";
import { stripUndefined } from "@/lib/sanitize";
import { recordPayment, type PaymentMethod } from "@/lib/mutations";
import type { Dictionary } from "@/i18n";
import type { Cents, Scope } from "@/lib/schema";

export interface PaymentContext {
  rowLabel: string;
  monthLabel: string;
  monthKey: string;
  expectedCents: Cents;
  currentPaidCents: Cents;
  obligationId: string;
  againstType: "invoice" | "pledgeMonth";
  scope: Scope;
  familyId?: string;
  memberId?: string;
}

export function RecordPaymentDialog({
  t,
  context,
  onClose,
}: {
  t: Dictionary;
  context: PaymentContext | null;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (context) {
      const prefillCents = context.currentPaidCents > 0 ? context.currentPaidCents : context.expectedCents;
      setAmount((prefillCents / 100).toString());
      setError("");
    }
  }, [context]);

  if (!context) return null;
  const ctx = context;

  async function submit() {
    const cents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      setError(t.error);
      return;
    }
    setSaving(true);
    
    try {
      const db = getFirestoreDb();
      if (db) {
        let obId = ctx.obligationId;

        if (ctx.againstType === "pledgeMonth") {
          if (!obId) obId = `pm-${ctx.memberId}-${ctx.monthKey}`;
          const pmRef = doc(db, "pledgeMonths", obId);
          const pmSnap = await getDoc(pmRef);
          if (pmSnap.exists()) {
            await updateDoc(pmRef, { paidCents: cents });
          } else {
            await setDoc(pmRef, stripUndefined({
              memberId: ctx.memberId,
              month: ctx.monthKey,
              expectedCents: ctx.expectedCents,
              paidCents: cents,
              status: "partial", 
              notes: ""
            }));
          }
        } else if (ctx.againstType === "invoice") {
          if (!obId) obId = `invoice-${ctx.familyId}-${ctx.monthKey}`;
          const invRef = doc(db, "invoices", obId);
          const invSnap = await getDoc(invRef);
          if (invSnap.exists()) {
            await updateDoc(invRef, { paidCents: cents });
          } else {
            await setDoc(invRef, stripUndefined({
              familyId: ctx.familyId,
              academicYearId: "2025-2026",
              month: ctx.monthKey,
              arabicChildren: 0,
              arabicFeeCents: 0,
              englishChildren: 0,
              englishFeeCents: 0,
              totalCents: ctx.expectedCents,
              paidCents: cents,
              status: "partial",
              isManualOverride: false,
              notes: ""
            }));
          }
        }

        if (cents > 0) {
          await recordPayment({
            scope: ctx.scope,
            againstType: ctx.againstType,
            againstId: obId,
            familyId: ctx.familyId,
            memberId: ctx.memberId,
            amountCents: cents,
            method,
            receivedByUid: "current-user",
          });
        }
      }
      queryClient.invalidateQueries();
      onClose();
    } catch (e) {
      setError(t.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-surface p-6 text-nour-green-900 shadow-xl dark:text-nour-cream-50"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <h2 className="font-heading text-lg font-semibold">{t.recordPayment}</h2>
        <p className="mt-1 text-sm text-nour-stone-400">
          {context.rowLabel} · {context.monthLabel}
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm text-nour-stone-400">{t.amount}</span>
            <input
              dir="ltr"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-nour-gold-300/60 bg-surface px-3 py-2 text-end tabular-nums"
            />
          </label>
          <label className="block">
            <span className="text-sm text-nour-stone-400">{t.method}</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="mt-1 w-full rounded-lg border border-nour-gold-300/60 bg-surface px-3 py-2"
            >
              <option value="cash">{t.cash}</option>
              <option value="transfer">{t.bankTransfer}</option>
              <option value="bizum">{t.bizum}</option>
            </select>
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-nour-stone-400 hover:bg-nour-cream-50 dark:hover:bg-nour-green-900"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-nour-green-900 px-4 py-2 text-sm text-nour-cream-50 disabled:opacity-50 dark:bg-nour-gold-500 dark:text-nour-green-900"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
