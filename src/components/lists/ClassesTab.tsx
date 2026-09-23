"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useClasses, useTeachers } from "@/lib/data/hooks";
import { recordClass, updateClass, archiveClass } from "@/lib/crud";
import { Field, inputClass, buttonClass, ghostButtonClass } from "../forms/shared";
import type { Dictionary } from "@/i18n";
import type { Class } from "@/lib/schema";

export function ClassesTab({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useClasses();
  const { data: teachers = [] } = useTeachers();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const teacherName = (id?: string) =>
    id ? teachers.find((x) => x.id === id)?.fullName ?? "—" : "—";

  function openAdd() {
    setEditing(null);
    setName("");
    setTeacherId("");
    setShowForm(true);
  }
  function openEdit(c: Class) {
    setEditing(c);
    setName(c.name);
    setTeacherId(c.teacherId ?? "");
    setShowForm(true);
  }

  async function submit() {
    if (!name.trim()) return;
    const patch = { name: name.trim(), teacherId: teacherId || undefined };
    if (editing) await updateClass(editing.id, patch);
    else await recordClass(patch);
    queryClient.invalidateQueries();
    setShowForm(false);
  }

  async function archive(id: string) {
    await archiveClass(id);
    queryClient.invalidateQueries();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={openAdd} className={buttonClass}>
          {t.add}
        </button>
      </div>

      {showForm && (
        <div className="space-y-2 rounded-xl border border-nour-gold-300/40 bg-surface p-4">
          <Field label={t.className}>
            <input dir="auto" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t.teacher}>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={inputClass}>
              <option value="">—</option>
              {teachers.filter((x) => x.isActive !== false).map((x) => (
                <option key={x.id} value={x.id}>{x.fullName}</option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className={ghostButtonClass}>
              {t.cancel}
            </button>
            <button type="button" onClick={submit} className={buttonClass}>
              {t.save}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted">{t.loading}</p>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-nour-gold-300/40 bg-surface py-12 text-center">
          <p className="text-sm text-muted">{t.emptyState}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nour-gold-300/40 bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-nour-gold-300/40 text-muted">
                <th className="px-4 py-3 text-start font-medium">{t.className}</th>
                <th className="px-4 py-3 text-start font-medium">{t.teacher}</th>
                <th className="px-4 py-3 text-start font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="border-b border-nour-gold-300/20 last:border-0">
                  <td className="px-4 py-3">
                    <span dir="auto">{c.name}</span>
                  </td>
                  <td className="px-4 py-3">{teacherName(c.teacherId)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(c)} className={ghostButtonClass}>
                        {t.edit}
                      </button>
                      <button type="button" onClick={() => archive(c.id)} className={ghostButtonClass}>
                        {t.archive}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
