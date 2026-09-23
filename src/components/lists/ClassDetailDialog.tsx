"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStudents, useTeachers } from "@/lib/data/hooks";
import { updateClass, updateStudent, removeStudentFromClass } from "@/lib/crud";
import { Field, inputClass, buttonClass, ghostButtonClass } from "../forms/shared";
import type { Dictionary } from "@/i18n";
import type { Class } from "@/lib/schema";

export function ClassDetailDialog({
  t,
  classItem,
  onClose,
}: {
  t: Dictionary;
  classItem: Class | null;
  onClose: () => void;
}) {
  const { data: students = [] } = useStudents();
  const { data: teachers = [] } = useTeachers();
  const queryClient = useQueryClient();
  const [teacherId, setTeacherId] = useState("");
  const [addStudentId, setAddStudentId] = useState("");

  useEffect(() => {
    if (classItem) {
      setTeacherId(classItem.teacherId ?? "");
      setAddStudentId("");
    }
  }, [classItem]);

  if (!classItem) return null;
  const cls = classItem;

  const members = students.filter((s) => s.classId === cls.id);
  const others = students.filter((s) => s.classId !== cls.id);

  async function changeTeacher() {
    await updateClass(cls.id, { teacherId: teacherId || undefined });
    queryClient.invalidateQueries();
  }

  async function addStudent() {
    if (!addStudentId) return;
    await updateStudent(addStudentId, { classId: cls.id });
    queryClient.invalidateQueries();
    setAddStudentId("");
  }

  async function removeStudent(studentId: string) {
    await removeStudentFromClass(studentId);
    queryClient.invalidateQueries();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <h2 className="font-heading text-lg font-semibold">{classItem.name}</h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="text-sm">
            <span className="text-muted">{t.classLevel}: </span>
            <span>{classItem.level || "—"}</span>
          </div>
          <Field label={t.teacher}>
            <div className="flex gap-2">
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {teachers.filter((x) => x.isActive !== false).map((x) => (
                  <option key={x.id} value={x.id}>{x.fullName}</option>
                ))}
              </select>
              <button type="button" onClick={changeTeacher} className={buttonClass}>
                {t.save}
              </button>
            </div>
          </Field>
        </div>

        <div className="mt-4">
          <h3 className="mb-2 font-heading text-base font-semibold">{t.students}</h3>
          {members.length === 0 ? (
            <p className="text-sm text-muted">{t.emptyState}</p>
          ) : (
            <ul className="space-y-1">
              {members.map((s) => (
                <li key={s.id} className="flex items-center justify-between">
                  <span dir="auto">{s.name}</span>
                  <button type="button" onClick={() => removeStudent(s.id)} className={ghostButtonClass}>
                    {t.delete}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex gap-2">
            <select
              value={addStudentId}
              onChange={(e) => setAddStudentId(e.target.value)}
              className={`${inputClass} grow`}
            >
              <option value="">{t.add} {t.students}</option>
              {others.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button type="button" onClick={addStudent} className={buttonClass}>
              {t.add}
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className={ghostButtonClass}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
