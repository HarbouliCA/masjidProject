"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTeachers } from "@/lib/data/hooks";
import { recordTeacher, updateTeacher, archiveTeacher } from "@/lib/crud";
import { Field, inputClass, buttonClass, ghostButtonClass } from "../forms/shared";
import { Money } from "../Money";
import type { Dictionary } from "@/i18n";
import type { Teacher } from "@/lib/schema";

export function TeachersTab({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useTeachers();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [salary, setSalary] = useState("");

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
    if (editing) await updateTeacher(editing.id, patch);
    else await recordTeacher(patch);
    queryClient.invalidateQueries();
    setShowForm(false);
  }

  async function archive(id: string) {
    await archiveTeacher(id);
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
            <input dir="auto" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          </Field>
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label={t.phone}>
              <input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </Field>
            <Field label={t.email}>
              <input dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </Field>
            <Field label={t.salary}>
              <input dir="ltr" inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} className={inputClass} />
            </Field>
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
                <th className="px-4 py-3 text-start font-medium">{t.phone}</th>
                <th className="px-4 py-3 text-start font-medium">{t.salary}</th>
                <th className="px-4 py-3 text-start font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((x) => (
                <tr key={x.id} className="border-b border-nour-gold-300/20 last:border-0">
                  <td className="px-4 py-3">
                    <span dir="auto">{x.fullName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span dir="ltr">{x.phone ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    {x.monthlySalaryCents ? <Money cents={x.monthlySalaryCents} /> : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(x)} className={ghostButtonClass}>
                        {t.edit}
                      </button>
                      <button type="button" onClick={() => archive(x.id)} className={ghostButtonClass}>
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
