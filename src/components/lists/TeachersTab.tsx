"use client";

import { useState } from "react";
import { useTeachers, useClasses } from "@/lib/data/hooks";
import {
  recordTeacher,
  updateTeacher,
  archiveTeacher,
  unarchiveTeacher,
  deleteTeacherPermanent,
} from "@/lib/crud";
import { Field, inputClass, buttonClass, ghostButtonClass } from "../forms/shared";
import { useSubmit } from "../forms/useSubmit";
import { ConfirmDialog } from "../ConfirmDialog";
import { Money } from "../Money";
import type { Dictionary } from "@/i18n";
import type { Teacher } from "@/lib/schema";

export function TeachersTab({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useTeachers();
  const { data: classes = [] } = useClasses();
  const { busy, error, saved, runAndInvalidate } = useSubmit();

  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [salary, setSalary] = useState("");

  const [toArchive, setToArchive] = useState<Teacher | null>(null);
  const [toDelete, setToDelete] = useState<Teacher | null>(null);

  const archivedCount = data.filter((x) => x.isActive === false).length;
  const visible = data.filter((x) =>
    showArchived ? x.isActive === false : x.isActive !== false
  );

  function openAdd() {
    setEditing(null);
    setFullName("");
    setPhone("");
    setEmail("");
    setSalary("");
    setShowForm(true);
  }

  function openEdit(x: Teacher) {
    setEditing(x);
    setFullName(x.fullName);
    setPhone(x.phone ?? "");
    setEmail(x.email ?? "");
    setSalary(x.monthlySalaryCents ? (x.monthlySalaryCents / 100).toString() : "");
    setShowForm(true);
  }

  async function submit() {
    if (!fullName.trim()) return;
    const monthlySalaryCents = salary ? Math.round(Number(salary) * 100) : undefined;
    if (monthlySalaryCents !== undefined && !Number.isFinite(monthlySalaryCents)) return;
    const patch = {
      fullName: fullName.trim(),
      phone: phone || undefined,
      email: email || undefined,
      monthlySalaryCents,
    };
    await runAndInvalidate(async () => {
      if (editing) await updateTeacher(editing.id, patch);
      else await recordTeacher(patch);
      setShowForm(false);
    });
  }

  async function confirmArchive() {
    if (!toArchive) return;
    await runAndInvalidate(async () => {
      await archiveTeacher(toArchive.id);
      setToArchive(null);
    });
  }

  async function handleUnarchive(id: string) {
    await runAndInvalidate(async () => {
      await unarchiveTeacher(id);
    });
  }

  async function confirmDelete() {
    if (!toDelete) return;
    await runAndInvalidate(async () => {
      await deleteTeacherPermanent(toDelete.id);
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
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="grid gap-2 sm:grid-cols-3">
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
            <Field label={t.salary}>
              <input
                dir="ltr"
                inputMode="decimal"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
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
              disabled={busy || !fullName.trim()}
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
                <th className="px-4 py-3 text-start font-medium">{t.classes}</th>
                <th className="px-4 py-3 text-start font-medium">{t.phone}</th>
                <th className="px-4 py-3 text-start font-medium">{t.salary}</th>
                <th className="px-4 py-3 text-start font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((x) => (
                <tr
                  key={x.id}
                  className="border-b border-nour-gold-300/20 last:border-0"
                >
                  <td className="px-4 py-3">
                    <span dir="auto">{x.fullName}</span>
                    {x.isActive === false && (
                      <span className="ms-2 rounded bg-warning/20 px-1.5 py-0.5 text-xs text-warning">
                        {t.archived}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span dir="auto">
                      {classes
                        .filter((c) => c.teacherId === x.id && c.isActive !== false)
                        .map((c) => c.name)
                        .join("، ") || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span dir="ltr">{x.phone ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    {x.monthlySalaryCents ? (
                      <Money cents={x.monthlySalaryCents} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {x.isActive !== false ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(x)}
                            className={ghostButtonClass}
                          >
                            {t.edit}
                          </button>
                          <button
                            type="button"
                            onClick={() => setToArchive(x)}
                            className={ghostButtonClass}
                          >
                            {t.archive}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUnarchive(x.id)}
                            className={buttonClass}
                          >
                            {t.unarchive}
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(x)}
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
        message={`${t.confirmDelete} ${toArchive?.fullName ?? ""}`}
        busy={busy}
        onCancel={() => setToArchive(null)}
        onConfirm={confirmArchive}
      />
      <ConfirmDialog
        t={t}
        open={!!toDelete}
        title={t.permanentDelete}
        message={`${t.confirmPermanentDelete} (${toDelete?.fullName ?? ""})`}
        busy={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
