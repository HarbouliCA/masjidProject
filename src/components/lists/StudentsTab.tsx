"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStudents, useFamilies, useClasses } from "@/lib/data/hooks";
import { recordStudent, updateStudent, archiveStudent } from "@/lib/crud";
import { Field, inputClass, buttonClass, ghostButtonClass } from "../forms/shared";
import type { Dictionary } from "@/i18n";
import type { Student } from "@/lib/schema";

export function StudentsTab({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useStudents();
  const { data: families = [] } = useFamilies();
  const { data: classes = [] } = useClasses();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("المستوى الأول");
  const [english, setEnglish] = useState(false);
  const [familyId, setFamilyId] = useState("");
  const [classId, setClassId] = useState("");

  const familyName = (id: string) => families.find((f) => f.id === id)?.parentName ?? t.noFamily;
  const className = (id?: string) => (id ? classes.find((c) => c.id === id)?.name ?? t.noClass : t.noClass);

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
    const patch = {
      name: name.trim(),
      level,
      englishEnrolled: english,
      familyId,
      classId: classId || undefined,
    };
    if (editing) await updateStudent(editing.id, patch);
    else await recordStudent(patch);
    queryClient.invalidateQueries();
    setShowForm(false);
  }

  async function archive(id: string) {
    await archiveStudent(id);
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
          <Field label={t.name}>
            <input dir="auto" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label={t.level}>
              <input dir="auto" value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass} />
            </Field>
            <Field label={t.family}>
              <select value={familyId} onChange={(e) => setFamilyId(e.target.value)} className={inputClass}>
                <option value="">{t.noFamily}</option>
                {families.map((f) => (
                  <option key={f.id} value={f.id}>{f.parentName}</option>
                ))}
              </select>
            </Field>
            <Field label={t.classes}>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputClass}>
                <option value="">{t.noClass}</option>
                {classes.filter((c) => c.isActive !== false).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm text-muted">
              <input type="checkbox" checked={english} onChange={(e) => setEnglish(e.target.checked)} />
              {t.english}
            </label>
          </div>
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
                <th className="px-4 py-3 text-start font-medium">{t.name}</th>
                <th className="px-4 py-3 text-start font-medium">{t.family}</th>
                <th className="px-4 py-3 text-start font-medium">{t.classes}</th>
                <th className="px-4 py-3 text-start font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id} className="border-b border-nour-gold-300/20 last:border-0">
                  <td className="px-4 py-3">
                    <span dir="auto">{s.name}</span>
                  </td>
                  <td className="px-4 py-3">{familyName(s.familyId)}</td>
                  <td className="px-4 py-3">{className(s.classId)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(s)} className={ghostButtonClass}>
                        {t.edit}
                      </button>
                      <button type="button" onClick={() => archive(s.id)} className={ghostButtonClass}>
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
