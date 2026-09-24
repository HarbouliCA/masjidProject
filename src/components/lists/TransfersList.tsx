"use client";

import { useState } from "react";
import { useTransfers } from "@/lib/data/hooks";
import { recordTransferDoc, updateTransferDoc, deleteTransferDoc } from "@/lib/crud";
import { parseEURToCents } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { Field, inputClass, buttonClass, ghostButtonClass } from "../forms/shared";
import { useSubmit } from "../forms/useSubmit";
import { ConfirmDialog } from "../ConfirmDialog";
import { Money } from "../Money";
import type { Dictionary } from "@/i18n";
import type { Transfer, Scope } from "@/lib/schema";

type Direction = "schoolToMasjid" | "masjidToSchool";

function directionToScopes(dir: Direction): { fromScope: Scope; toScope: Scope } {
  return dir === "schoolToMasjid"
    ? { fromScope: "school", toScope: "masjid" }
    : { fromScope: "masjid", toScope: "school" };
}

export function TransfersList({
  t,
  perspective = "masjid",
}: {
  t: Dictionary;
  perspective?: Scope;
}) {
  const { data = [], isLoading } = useTransfers();
  const { busy, error, saved, runAndInvalidate } = useSubmit();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transfer | null>(null);
  const [direction, setDirection] = useState<Direction>("schoolToMasjid");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [toDelete, setToDelete] = useState<Transfer | null>(null);

  const q = search.trim().toLowerCase();
  const filtered = data.filter((tr) => {
    if (!q) return true;
    const label = directionLabel(tr.fromScope).toLowerCase();
    return label.includes(q) || (tr.notes ?? "").toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const netCents = data.reduce((sum, tr) => {
    return tr.toScope === perspective ? sum + tr.amountCents : sum - tr.amountCents;
  }, 0);

  function directionLabel(fromScope: Scope): string {
    return fromScope === "school" ? t.schoolToMasjid : t.masjidToSchool;
  }

  function openAdd() {
    setEditing(null);
    setDirection("schoolToMasjid");
    setDate(new Date().toISOString().slice(0, 10));
    setAmount("");
    setNotes("");
    setShowForm(true);
  }

  function openEdit(tr: Transfer) {
    setEditing(tr);
    setDirection(tr.fromScope === "school" ? "schoolToMasjid" : "masjidToSchool");
    setDate(tr.date);
    setAmount((tr.amountCents / 100).toString());
    setNotes(tr.notes ?? "");
    setShowForm(true);
  }

  async function submit() {
    const cents = parseEURToCents(amount);
    const { fromScope, toScope } = directionToScopes(direction);
    await runAndInvalidate(async () => {
      if (!date) throw new Error(`${t.date}: ${t.error}`);
      if (!Number.isFinite(cents) || cents <= 0) throw new Error(`${t.amount}: ${t.saveError}`);
      const patch = {
        fromScope,
        toScope,
        amountCents: cents,
        date,
        notes: notes.trim(),
      };
      if (editing) await updateTransferDoc(editing.id, patch);
      else await recordTransferDoc(patch);
      setShowForm(false);
    });
  }

  async function confirmDelete() {
    if (!toDelete) return;
    await runAndInvalidate(async () => {
      await deleteTransferDoc(toDelete.id);
      setToDelete(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="rounded-xl border border-nour-gold-300/40 bg-surface p-4">
          <p className="text-sm text-muted">{t.net}</p>
          <Money
            cents={netCents}
            className={`mt-1 block font-heading text-xl font-semibold ${netCents < 0 ? "text-danger" : "text-success"}`}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            dir="auto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className={`${inputClass} w-full sm:w-48`}
          />
          <button type="button" onClick={openAdd} className={buttonClass}>
            {t.add}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="space-y-2 rounded-xl border border-nour-gold-300/40 bg-surface p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label={t.transferDirection}>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as Direction)}
                className={inputClass}
              >
                <option value="schoolToMasjid">{t.schoolToMasjid}</option>
                <option value="masjidToSchool">{t.masjidToSchool}</option>
              </select>
            </Field>
            <Field label={t.amount}>
              <input dir="ltr" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label={t.date}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t.notes}>
            <textarea dir="auto" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            {saved && <span className="text-sm text-success">{t.saved}</span>}
            <button type="button" onClick={() => setShowForm(false)} className={ghostButtonClass}>
              {t.cancel}
            </button>
            <button type="button" onClick={submit} disabled={busy} className={buttonClass}>
              {busy ? t.saving : t.save}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted">{t.loading}</p>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-nour-gold-300/40 bg-surface py-12 text-center">
          <p className="text-sm text-muted">{t.emptyState}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nour-gold-300/40 bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-nour-gold-300/40 text-muted">
                <th className="px-4 py-3 text-start font-medium">{t.date}</th>
                <th className="px-4 py-3 text-start font-medium">{t.transferDirection}</th>
                <th className="px-4 py-3 text-start font-medium">{t.amount}</th>
                <th className="px-4 py-3 text-start font-medium">{t.notes}</th>
                <th className="px-4 py-3 text-start font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((tr) => {
                const receiving = tr.toScope === perspective;
                return (
                  <tr key={tr.id} className="border-b border-nour-gold-300/20 last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {tr.date ? formatDate(new Date(`${tr.date}T12:00:00Z`)) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span dir="auto">{directionLabel(tr.fromScope)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={receiving ? "text-success" : "text-danger"}>
                        {receiving ? "+" : "−"}
                        <Money cents={tr.amountCents} className="ms-1" />
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span dir="auto">{tr.notes || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openEdit(tr)} className={ghostButtonClass}>
                          {t.edit}
                        </button>
                        <button type="button" onClick={() => setToDelete(tr)} className="rounded-lg border border-danger/60 px-3 py-1.5 text-sm text-danger hover:bg-danger/10">
                          {t.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        t={t}
        open={!!toDelete}
        title={t.delete}
        message={`${t.confirmPermanentDelete} (${toDelete ? directionLabel(toDelete.fromScope) : ""})`}
        busy={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
