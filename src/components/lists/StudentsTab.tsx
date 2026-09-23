"use client";

import { useState } from "react";
import { deleteField } from "firebase/firestore";
import { useStudents, useFamilies, useClasses } from "@/lib/data/hooks";
import {
  recordStudent,
  updateStudent,
  archiveStudent,
  unarchiveStudent,
  deleteStudentPermanent,
} from "@/lib/crud";
import { Field, inputClass, buttonClass, ghostButtonClass } from "../forms/shared";
import { useSubmit } from "../forms/useSubmit";
import { ConfirmDialog } from "../ConfirmDialog";
import type { Dictionary } from "@/i18n";
import type { Student } from "@/lib/schema";

export function StudentsTab({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useStudents();
  const { data: families = [] } = useFamilies();
  const { data: classes = [] } = useClasses();
  const { busy, error, saved, runAndInvalidate } = useSubmit();

  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("المستوى الأول");
  const [english, setEnglish] = useState(false);
  const [familyId, setFamilyId] = useState("");
  const [classId, setClassId] = useState("");

  const [toArchive, setToArchive] = useState<Student | null>(null);
  const [toDelete, setToDelete] = useState<Student | null>(null);

  const familyName = (id: string) =>
    families.find((f) => f.id === id)?.parentName ?? t.noFamily;
  const className = (id?: string) =>
    id ? classes.find((c) => c.id === id)?.name ?? t.noClass : t.noClass;

  const archivedCount = data.filter((s) => s.isActive === false).length;
  const visible = data.filter((s) =>
    showArchived ? s.isActive === false : s.isActive !== false
  );

  function openAdd() {
    setEditing(null);
    setName("");
    setLevel("المستوى الأول");
    setEnglish(false);
    setFamilyId("");
    setClassId("");
    setShowForm(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setName(s.name);
    setLevel(s.level);
    setEnglish(s.englishEnrolled);
    setFamilyId(s.familyId);
    setClassId(s.classId ?? "");
    setShowForm(true);
  }

  async function submit() {
    if (!name.trim() || !familyId) return;
    const patch: Record<string, unknown> = {
      name: name.trim(),
      level,
      englishEnrolled: english,
      familyId,
      classId: classId ? classId : deleteField(),
    };
    await runAndInvalidate(async () => {
      if (editing) await updateStudent(editing.id, patch);
      else await recordStudent({
        familyId,
        name: name.trim(),
        level,
        englishEnrolled: english,
        classId: classId || undefined,
      });
      setShowForm(false);
    });
  }

  async function confirmArchive() {
    if (!toArchive) return;
    await runAndInvalidate(async () => {
      await archiveStudent(toArchive.id);
      setToArchive(null);
    });
  }

  async function handleUnarchive(id: string) {
    await runAndInvalidate(async () => {
      await unarchiveStudent(id);
    });
  }

  async function confirmDelete() {
    if (!toDelete) return;
    await runAndInvalidate(async () => {
      await deleteStudentPermanent(toDelete.id);
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label={t.level}>
              <input
                dir="auto"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t.family}>
              <select
                value={familyId}
                onChange={(e) => setFamilyId(e.target.value)}
                className={inputClass}
              >
                <option value="">{t.noFamily}</option>
                {families
                  .filter((f) => f.isActive !== false)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.parentName}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label={t.classes}>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className={inputClass}
              >
                <option value="">{t.noClass}</option>
                {classes
                  .filter((c) => c.isActive !== false)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={english}
                onChange={(e) => setEnglish(e.target.checked)}
              />
              {t.english}
            </label>
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
              disabled={busy || !name.trim() || !familyId}
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
                <th className="px-4 py-3 text-start font-medium">{t.family}</th>
                <th className="px-4 py-3 text-start font-medium">{t.classes}</th>
                <th className="px-4 py-3 text-start font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-nour-gold-300/20 last:border-0"
                >
                  <td className="px-4 py-3">
                    <span dir="auto">{s.name}</span>
                    {s.isActive === false && (
                      <span className="ms-2 rounded bg-warning/20 px-1.5 py-0.5 text-xs text-warning">
                        {t.archived}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{familyName(s.familyId)}</td>
                  <td className="px-4 py-3">{className(s.classId)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {s.isActive !== false ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(s)}
                            className={ghostButtonClass}
                          >
                            {t.edit}
                          </button>
                          <button
                            type="button"
                            onClick={() => setToArchive(s)}
                            className={ghostButtonClass}
                          >
                            {t.archive}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUnarchive(s.id)}
                            className={buttonClass}
                          >
                            {t.unarchive}
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(s)}
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
