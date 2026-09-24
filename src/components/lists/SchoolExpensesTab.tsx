"use client";

import { useState } from "react";
import { useExpenses } from "@/lib/data/hooks";
import {
  recordExpenseDoc,
  updateExpenseDoc,
  archiveExpenseDoc,
  unarchiveExpenseDoc,
  deleteExpenseDoc,
} from "@/lib/crud";
import { parseEURToCents } from "@/lib/money";
import { formatDate, formatMonthKey } from "@/lib/dates";
import { Field, inputClass, buttonClass, ghostButtonClass } from "../forms/shared";
import { useSubmit } from "../forms/useSubmit";
import { ConfirmDialog } from "../ConfirmDialog";
import { Money } from "../Money";
import type { Dictionary } from "@/i18n";
import type { Expense } from "@/lib/schema";

export function SchoolExpensesTab({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useExpenses();
  const { busy, error, saved, runAndInvalidate } = useSubmit();

  const schoolExpenses = data.filter((e) => e.scope === "school");

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [toArchive, setToArchive] = useState<Expense | null>(null);
  const [toDelete, setToDelete] = useState<Expense | null>(null);

  const archivedCount = schoolExpenses.filter((e) => e.isActive === false).length;
  const activeExpenses = schoolExpenses.filter((e) =>
    showArchived ? e.isActive === false : e.isActive !== false
  );

  const filtered = activeExpenses.filter((e) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      e.description.toLowerCase().includes(q) ||
      e.observation.toLowerCase().includes(q);
    const matchFrom = !fromDate || (e.date && e.date >= fromDate);
    const matchTo = !toDate || (e.date && e.date <= toDate);
    return matchSearch && matchFrom && matchTo;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "date") {
      const cmp = (a.date || "").localeCompare(b.date || "");
      return sortAsc ? cmp : -cmp;
    }
    const cmp = a.amountCents - b.amountCents;
    return sortAsc ? cmp : -cmp;
  });

  const totalCents = activeExpenses.reduce((s, e) => s + e.amountCents, 0);
  const currentMonth = formatMonthKey(new Date());
  const monthCents = activeExpenses
    .filter((e) => (e.date || "").startsWith(currentMonth))
    .reduce((s, e) => s + e.amountCents, 0);

  function openAdd() {
    setEditing(null);
    setDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setAmount("");
    setNotes("");
    setShowForm(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setDate(e.date);
    setDescription(e.description);
    setAmount((e.amountCents / 100).toString());
    setNotes(e.observation ?? "");
    setShowForm(true);
  }

  async function submit() {
    const cents = parseEURToCents(amount);
    await runAndInvalidate(async () => {
      if (!date) throw new Error(`${t.expenseDate}: ${t.error}`);
      if (!description.trim()) throw new Error(`${t.expenseDescription}: ${t.error}`);
      if (!Number.isFinite(cents) || cents <= 0) throw new Error(`${t.amount}: ${t.saveError}`);
      const patch = {
        date,
        description: description.trim(),
        amountCents: cents,
        observation: notes.trim(),
      };
      if (editing) await updateExpenseDoc(editing.id, patch);
      else await recordExpenseDoc({ scope: "school", category: "other", ...patch });
      setShowForm(false);
    });
  }

  async function confirmArchive() {
    if (!toArchive) return;
    await runAndInvalidate(async () => {
      await archiveExpenseDoc(toArchive.id);
      setToArchive(null);
    });
  }

  async function handleUnarchive(id: string) {
    await runAndInvalidate(async () => {
      await unarchiveExpenseDoc(id);
    });
  }

  async function confirmDelete() {
    if (!toDelete) return;
    await runAndInvalidate(async () => {
      await deleteExpenseDoc(toDelete.id);
      setToDelete(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-nour-gold-300/40 bg-surface p-4">
          <p className="text-sm text-muted">{t.totalExpenses}</p>
          <Money cents={totalCents} className="mt-1 block font-heading text-xl font-semibold text-foreground" />
        </div>
        <div className="rounded-xl border border-nour-gold-300/40 bg-surface p-4">
          <p className="text-sm text-muted">{t.monthExpenses}</p>
          <Money cents={monthCents} className="mt-1 block font-heading text-xl font-semibold text-foreground" />
        </div>
        <div className="rounded-xl border border-nour-gold-300/40 bg-surface p-4">
          <p className="text-sm text-muted">{t.expenseCount}</p>
          <p className="mt-1 font-heading text-xl font-semibold text-foreground">{activeExpenses.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          dir="auto"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchExpenses}
          className={`${inputClass} w-full sm:w-64`}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">{t.fromDate}</span>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">{t.toDate}</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputClass} />
        </div>
        {archivedCount > 0 && (
          <button type="button" onClick={() => setShowArchived((v) => !v)} className={ghostButtonClass}>
            {showArchived ? t.hideArchived : `${t.showArchived} (${archivedCount})`}
          </button>
        )}
        {!showArchived && (
          <button type="button" onClick={openAdd} className={`${buttonClass} ms-auto`}>
            {t.addExpense}
          </button>
        )}
      </div>

      {showForm && (
        <div className="space-y-2 rounded-xl border border-nour-gold-300/40 bg-surface p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label={t.expenseDate}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </Field>
            <Field label={t.amount}>
              <input dir="ltr" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label={t.expenseDescription}>
            <input dir="auto" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t.expenseNotes}>
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
                <th className="px-4 py-3 text-start font-medium">
                  <button type="button" onClick={() => { setSortBy("date"); setSortAsc(sortBy === "date" ? !sortAsc : false); }} className="hover:text-nour-gold-600">
                    {t.expenseDate}
                  </button>
                </th>
                <th className="px-4 py-3 text-start font-medium">{t.expenseDescription}</th>
                <th className="px-4 py-3 text-start font-medium">
                  <button type="button" onClick={() => { setSortBy("amount"); setSortAsc(sortBy === "amount" ? !sortAsc : false); }} className="hover:text-nour-gold-600">
                    {t.amount}
                  </button>
                </th>
                <th className="px-4 py-3 text-start font-medium">{t.expenseNotes}</th>
                <th className="px-4 py-3 text-start font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => (
                <tr key={e.id} className="border-b border-nour-gold-300/20 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {e.date ? formatDate(new Date(`${e.date}T12:00:00Z`)) : "—"}
                    {e.isActive === false && (
                      <span className="ms-2 rounded bg-warning/20 px-1.5 py-0.5 text-xs text-warning">{t.archived}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span dir="auto">{e.description}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Money cents={e.amountCents} />
                  </td>
                  <td className="px-4 py-3">
                    <span dir="auto">{e.observation || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {e.isActive !== false ? (
                        <>
                          <button type="button" onClick={() => openEdit(e)} className={ghostButtonClass}>
                            {t.edit}
                          </button>
                          <button type="button" onClick={() => setToArchive(e)} className={ghostButtonClass}>
                            {t.archive}
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => handleUnarchive(e.id)} className={buttonClass}>
                            {t.unarchive}
                          </button>
                          <button type="button" onClick={() => setToDelete(e)} className="rounded-lg border border-danger/60 px-3 py-1.5 text-sm text-danger hover:bg-danger/10">
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
        message={`${t.confirmDelete} ${toArchive?.description ?? ""}`}
        busy={busy}
        onCancel={() => setToArchive(null)}
        onConfirm={confirmArchive}
      />
      <ConfirmDialog
        t={t}
        open={!!toDelete}
        title={t.permanentDelete}
        message={`${t.confirmPermanentDelete} (${toDelete?.description ?? ""})`}
        busy={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
