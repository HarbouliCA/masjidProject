"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFamilies } from "@/lib/data/hooks";
import { recordFamily, updateFamily, archiveFamily } from "@/lib/crud";
import { Field, inputClass, buttonClass, ghostButtonClass } from "../forms/shared";
import type { Dictionary } from "@/i18n";
import type { Family } from "@/lib/schema";

export function FamiliesTab({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useFamilies();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Family | null>(null);
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

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
    const patch = { parentName: parentName.trim(), phone: phone || undefined, email: email || undefined };
    if (editing) await updateFamily(editing.id, patch);
    else await recordFamily(patch);
    queryClient.invalidateQueries();
    setShowForm(false);
  }

  async function archive(id: string) {
    await archiveFamily(id);
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
            <input dir="auto" value={parentName} onChange={(e) => setParentName(e.target.value)} className={inputClass} />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label={t.phone}>
              <input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </Field>
            <Field label={t.email}>
              <input dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
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
                <th className="px-4 py-3 text-start font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((f) => (
                <tr key={f.id} className="border-b border-nour-gold-300/20 last:border-0">
                  <td className="px-4 py-3">
                    <span dir="auto">{f.parentName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span dir="ltr">{f.phone ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(f)} className={ghostButtonClass}>
                        {t.edit}
                      </button>
                      <button type="button" onClick={() => archive(f.id)} className={ghostButtonClass}>
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
