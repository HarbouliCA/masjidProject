"use client";

import { useState } from "react";
import { useDonations } from "@/lib/data/hooks";
import {
  recordDonationDoc,
  updateDonationDoc,
  archiveDonationDoc,
  unarchiveDonationDoc,
  deleteDonationDoc,
} from "@/lib/crud";
import { parseEURToCents } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { Field, inputClass, buttonClass, ghostButtonClass } from "../forms/shared";
import { useSubmit } from "../forms/useSubmit";
import { ConfirmDialog } from "../ConfirmDialog";
import { Money } from "../Money";
import type { Dictionary } from "@/i18n";
import type { Donation } from "@/lib/schema";

export function FridayTab({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useDonations();
  const { busy, error, saved, runAndInvalidate } = useSubmit();

  const donations = data.filter((d) => d.channel === "friday_box");

  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Donation | null>(null);
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [toArchive, setToArchive] = useState<Donation | null>(null);
  const [toDelete, setToDelete] = useState<Donation | null>(null);

  const archivedCount = donations.filter((d) => d.isActive === false).length;
  const activeDonations = donations.filter((d) =>
    showArchived ? d.isActive === false : d.isActive !== false
  );

  const sorted = [...activeDonations].sort((a, b) =>
    (a.date ?? "").localeCompare(b.date ?? "")
  );

  const totalCents = activeDonations.reduce((s, d) => s + d.amountCents, 0);

  function openAdd() {
    setEditing(null);
    setDate(new Date().toISOString().slice(0, 10));
    setAmount("");
    setNotes("");
    setShowForm(true);
  }

  function openEdit(d: Donation) {
    setEditing(d);
    setDate(d.date);
    setAmount((d.amountCents / 100).toString());
    setNotes(d.notes ?? "");
    setShowForm(true);
  }

  async function submit() {
    const cents = parseEURToCents(amount);
    await runAndInvalidate(async () => {
      if (!date) throw new Error(`${t.date}: ${t.error}`);
      if (!Number.isFinite(cents) || cents < 0) throw new Error(`${t.amount}: ${t.saveError}`);
      if (editing) {
        await updateDonationDoc(editing.id, {
          date,
          amountCents: cents,
          notes: notes.trim(),
        });
      } else {
        await recordDonationDoc({
          date,
          amountCents: cents,
          notes: notes.trim(),
          channel: "friday_box",
          donorType: "box",
        });
      }
      setShowForm(false);
    });
  }

  async function confirmArchive() {
    if (!toArchive) return;
    await runAndInvalidate(async () => {
      await archiveDonationDoc(toArchive.id);
      setToArchive(null);
    });
  }

  async function handleUnarchive(id: string) {
    await runAndInvalidate(async () => {
      await unarchiveDonationDoc(id);
    });
  }

  async function confirmDelete() {
    if (!toDelete) return;
    await runAndInvalidate(async () => {
      await deleteDonationDoc(toDelete.id);
      setToDelete(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-nour-gold-300/40 bg-surface p-4">
        <p className="text-sm text-muted">{t.total}</p>
        <Money cents={totalCents} className="mt-1 block font-heading text-xl font-semibold text-foreground" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {archivedCount > 0 && (
          <button type="button" onClick={() => setShowArchived((v) => !v)} className={ghostButtonClass}>
            {showArchived ? t.hideArchived : `${t.showArchived} (${archivedCount})`}
          </button>
        )}
        {!showArchived && (
          <button type="button" onClick={openAdd} className={`${buttonClass} ms-auto`}>
            {t.add}
          </button>
        )}
      </div>

      {showForm && (
        <div className="space-y-2 rounded-xl border border-nour-gold-300/40 bg-surface p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label={t.date}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </Field>
            <Field label={t.amount}>
              <input dir="ltr" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
            </Field>
          </div>
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
                <th className="px-4 py-3 text-start font-medium">{t.amount}</th>
                <th className="px-4 py-3 text-start font-medium">{t.notes}</th>
                <th className="px-4 py-3 text-start font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.id} className="border-b border-nour-gold-300/20 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {d.date ? formatDate(new Date(`${d.date}T12:00:00Z`)) : "—"}
                    {d.isActive === false && (
                      <span className="ms-2 rounded bg-warning/20 px-1.5 py-0.5 text-xs text-warning">{t.archived}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Money cents={d.amountCents} />
                  </td>
                  <td className="px-4 py-3">
                    <span dir="auto">{d.notes || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {d.isActive !== false ? (
                        <>
                          <button type="button" onClick={() => openEdit(d)} className={ghostButtonClass}>
                            {t.edit}
                          </button>
                          <button type="button" onClick={() => setToArchive(d)} className={ghostButtonClass}>
                            {t.archive}
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => handleUnarchive(d.id)} className={buttonClass}>
                            {t.unarchive}
                          </button>
                          <button type="button" onClick={() => setToDelete(d)} className="rounded-lg border border-danger/60 px-3 py-1.5 text-sm text-danger hover:bg-danger/10">
                            {t.permanentDelete}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        t={t}
        open={!!toArchive}
        title={t.archive}
        message={`${t.confirmDelete} ${toArchive?.date ?? ""}`}
        busy={busy}
        onCancel={() => setToArchive(null)}
        onConfirm={confirmArchive}
      />
      <ConfirmDialog
        t={t}
        open={!!toDelete}
        title={t.permanentDelete}
        message={`${t.confirmPermanentDelete} (${toDelete?.date ?? ""})`}
        busy={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
