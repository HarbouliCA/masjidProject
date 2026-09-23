"use client";

import { useState } from "react";
import { useClasses, useTeachers } from "@/lib/data/hooks";
import {
  recordClass,
  updateClass,
  archiveClass,
  unarchiveClass,
  deleteClassPermanent,
} from "@/lib/crud";
import { Field, inputClass, buttonClass, ghostButtonClass } from "../forms/shared";
import { useSubmit } from "../forms/useSubmit";
import { ConfirmDialog } from "../ConfirmDialog";
import { ClassDetailDialog } from "./ClassDetailDialog";
import type { Dictionary } from "@/i18n";
import type { Class } from "@/lib/schema";

export function ClassesTab({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useClasses();
  const { data: teachers = [] } = useTeachers();
  const { busy, error, saved, runAndInvalidate } = useSubmit();

  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const [detail, setDetail] = useState<Class | null>(null);
  const [toArchive, setToArchive] = useState<Class | null>(null);
  const [toDelete, setToDelete] = useState<Class | null>(null);

  const teacherName = (id?: string) =>
    id ? teachers.find((x) => x.id === id)?.fullName ?? "—" : "—";

  const archivedCount = data.filter((c) => c.isActive === false).length;
  const visible = data.filter((c) =>
    showArchived ? c.isActive === false : c.isActive !== false
  );

  function openAdd() {
    setEditing(null);
    setName("");
    setLevel("");
    setTeacherId("");
    setShowForm(true);
  }

  function openEdit(c: Class) {
    setEditing(c);
    setName(c.name);
    setLevel(c.level ?? "");
    setTeacherId(c.teacherId ?? "");
    setShowForm(true);
  }

  async function submit() {
    if (!name.trim()) return;
    const patch = {
      name: name.trim(),
      level: level.trim() || undefined,
      teacherId: teacherId || undefined,
    };
    await runAndInvalidate(async () => {
      if (editing) await updateClass(editing.id, patch);
      else await recordClass(patch);
      setShowForm(false);
    });
  }

  async function confirmArchive() {
    if (!toArchive) return;
    await runAndInvalidate(async () => {
      await archiveClass(toArchive.id);
      setToArchive(null);
    });
  }

  async function handleUnarchive(id: string) {
    await runAndInvalidate(async () => {
      await unarchiveClass(id);
    });
  }

  async function confirmDelete() {
    if (!toDelete) return;
    await runAndInvalidate(async () => {
      await deleteClassPermanent(toDelete.id);
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
          <Field label={t.className}>
            <input
              dir="auto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label={t.classLevel}>
              <input
                dir="auto"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t.teacher}>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {teachers
                  .filter((x) => x.isActive !== false)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.fullName}
                    </option>
                  ))}
              </select>
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
              disabled={busy}
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
                <th className="px-4 py-3 text-start font-medium">{t.className}</th>
                <th className="px-4 py-3 text-start font-medium">{t.classLevel}</th>
                <th className="px-4 py-3 text-start font-medium">{t.teacher}</th>
                <th className="px-4 py-3 text-start font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-nour-gold-300/20 last:border-0"
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setDetail(c)}
                      className="font-medium text-accent hover:underline"
                    >
                      <span dir="auto">{c.name}</span>
                    </button>
                    {c.isActive === false && (
                      <span className="ms-2 rounded bg-warning/20 px-1.5 py-0.5 text-xs text-warning">
                        {t.archived}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{c.level || "—"}</td>
                  <td className="px-4 py-3">{teacherName(c.teacherId)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {c.isActive !== false ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className={ghostButtonClass}
                          >
                            {t.edit}
                          </button>
                          <button
                            type="button"
                            onClick={() => setToArchive(c)}
                            className={ghostButtonClass}
                          >
                            {t.archive}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUnarchive(c.id)}
                            className={buttonClass}
                          >
                            {t.unarchive}
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(c)}
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

      <ClassDetailDialog
        t={t}
        classItem={detail}
        onClose={() => setDetail(null)}
      />
      <ConfirmDialog
        t={t}
        open={!!toArchive}
        title={t.archive}
        message={`${t.confirmDelete} ${toArchive?.name ?? ""}`}
        busy={busy}
        onCancel={() => setToArchive(null)}
        onConfirm={confirmArchive}
      />
      <ConfirmDialog
        t={t}
        open={!!toDelete}
        title={t.permanentDelete}
        message={`${t.confirmPermanentDelete} (${toDelete?.name ?? ""})`}
        busy={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
