"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { recordMember, updateMember, archiveMember } from "@/lib/crud";
import { Field, inputClass, buttonClass, ghostButtonClass } from "./forms/shared";
import type { Dictionary } from "@/i18n";
import type { Member } from "@/lib/schema";

export function MemberForm({
  t,
  open,
  member,
  onClose,
}: {
  t: Dictionary;
  open: boolean;
  member: Member | null;
  onClose: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [pledge, setPledge] = useState("10");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setFullName(member?.fullName ?? "");
      setPledge(member ? (member.monthlyPledgeCents / 100).toString() : "10");
    }
  }, [open, member]);

  if (!open) return null;

  async function submit() {
    const cents = Math.round(Number(pledge) * 100);
    if (!fullName.trim() || !Number.isFinite(cents) || cents <= 0) return;
    if (member) {
      await updateMember(member.id, { fullName: fullName.trim(), monthlyPledgeCents: cents });
    } else {
      await recordMember({ fullName: fullName.trim(), monthlyPledgeCents: cents });
    }
    queryClient.invalidateQueries();
    onClose();
  }

  async function archive() {
    if (!member) return;
    await archiveMember(member.id);
    queryClient.invalidateQueries();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <h2 className="font-heading text-lg font-semibold">
          {member ? t.edit : t.add} · {t.members}
        </h2>

        <div className="mt-4 space-y-3">
          <Field label={t.name}>
            <input dir="auto" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t.monthlyPledge}>
            <input dir="ltr" inputMode="decimal" value={pledge} onChange={(e) => setPledge(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {member && (
            <button type="button" onClick={archive} className={ghostButtonClass}>
              {t.archive}
            </button>
          )}
          <button type="button" onClick={onClose} className={ghostButtonClass}>
            {t.cancel}
          </button>
          <button type="button" onClick={submit} className={buttonClass}>
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
