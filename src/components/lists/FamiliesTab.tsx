"use client";

import { useState } from "react";
import { useFamilies } from "@/lib/data/hooks";
import {
  recordFamily,
  updateFamily,
  archiveFamily,
  unarchiveFamily,
  deleteFamilyPermanent,
} from "@/lib/crud";
import { Field, inputClass, buttonClass, ghostButtonClass } from "../forms/shared";
import { useSubmit } from "../forms/useSubmit";
import { ConfirmDialog } from "../ConfirmDialog";
import type { Dictionary } from "@/i18n";
import type { Family } from "@/lib/schema";

export function FamiliesTab({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useFamilies();
  const { busy, error, saved, runAndInvalidate } = useSubmit();

  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Family | null>(null);
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [toArchive, setToArchive] = useState<Family | null>(null);
  const [toDelete, setToDelete] = useState<Family | null>(null);

  const archivedCount = data.filter((f) => f.isActive === false).length;
  const visible = data.filter((f) =>
    showArchived ? f.isActive === false : f.isActive !== false
  );

  function openAdd() {
    setEditing(null);
    setParentName("");
    setPhone("");
    setEmail("");
    setShowForm(true);
  }

  function openEdit(f: Family) {
    setEditing(f);
    setParentName(f.parentName);
    setPhone(f.phone ?? "");
    setEmail(f.email ?? "");
    setShowForm(true);
  }

  async function submit() {
    if (!parentName.trim()) return;
    const patch = {
      parentName: parentName.trim(),
      phone: phone || undefined,
      email: email || undefined,
    };
    await runAndInvalidate(async () => {
      if (editing) await updateFamily(editing.id, patch);
      else await recordFamily(patch);
      setShowForm(false);
    });
  }

  async function confirmArchive() {
    if (!toArchive) return;
    await runAndInvalidate(async () => {
      await archiveFamily(toArchive.id);
      setToArchive(null);
    });
  }

  async function handleUnarchive(id: string) {
    await runAndInvalidate(async () => {
      await unarchiveFamily(id);
    });
  }

  async function confirmDelete() {
    if (!toDelete) return;
    await runAndInvalidate(async () => {
      await deleteFamilyPermanent(toDelete.id);
      setToDelete(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {archivedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className={ghostButtonClass}
            >
              {showArchived ? t.hideArchived : `${t.showArchived} (${archivedCount})`}
            </button>
          )}
        </div>
        {!showArchived && (
          <button type="button" onClick={openAdd} className={buttonClass}>
            {t.add}
          </button>
        )}
      </div>

      {showForm && (
        <div className="space-y-2 rounded-xl border border-nour-gold-300/40 bg-surface p-4">
          <Field label={t.name}>
            <input
              dir="auto"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label={t.phone}>
              <input
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t.email}>
              <input
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            {saved && <span className="text-sm text-success">{t.saved}</span>}
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className={ghostButtonClass}
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={busy || !parentName.trim()}
              className={buttonClass}
            >
              {busy ? t.saving : t.save}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted">{t.loading}</p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-nour-gold-300/40 bg-surface py-12 text-center">
          <p className="text-sm text-muted">{t.emptyState}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nour-gold-300/40 bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-nour-gold-300/40 text-muted">
                <th className="px-4 py-3 text-start font-medium">{t.name}</th>
                <th className="px-4 py-3 text-start font-medium">{t.phone}</th>
                <th className="px-4 py-3 text-start font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((f) => (
                <tr
                  key={f.id}
                  className="border-b border-nour-gold-300/20 last:border-0"
                >
                  <td className="px-4 py-3">
                    <span dir="auto">{f.parentName}</span>
                    {f.isActive === false && (
                      <span className="ms-2 rounded bg-warning/20 px-1.5 py-0.5 text-xs text-warning">
                        {t.archived}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span dir="ltr">{f.phone ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {f.isActive !== false ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(f)}
                            className={ghostButtonClass}
                          >
                            {t.edit}
                          </button>
                          <button
                            type="button"
                            onClick={() => setToArchive(f)}
                            className={ghostButtonClass}
                          >
                            {t.archive}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUnarchive(f.id)}
                            className={buttonClass}
                          >
                            {t.unarchive}
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(f)}
                            className="rounded-lg border border-danger/60 px-3 py-1.5 text-sm text-danger hover:bg-danger/10"
                          >
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
        message={`${t.confirmDelete} ${toArchive?.parentName ?? ""}`}
        busy={busy}
        onCancel={() => setToArchive(null)}
        onConfirm={confirmArchive}
      />
      <ConfirmDialog
        t={t}
        open={!!toDelete}
        title={t.permanentDelete}
        message={`${t.confirmPermanentDelete} (${toDelete?.parentName ?? ""})`}
        busy={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
