"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteField } from "firebase/firestore";
import { useMembers } from "@/lib/data/hooks";
import { recordMember, updateMember, archiveMember, unarchiveMember, deleteMemberPermanent } from "@/lib/crud";
import { Field, inputClass, buttonClass, ghostButtonClass } from "./forms/shared";
import { useSubmit } from "./forms/useSubmit";
import { ConfirmDialog } from "./ConfirmDialog";
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
  const { data: members = [] } = useMembers();
  const [fullName, setFullName] = useState("");
  const [pledge, setPledge] = useState("10");
  const [memberNumber, setMemberNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [nie, setNie] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { busy, error, saved, runAndInvalidate } = useSubmit();

  const nextMemberNumber = useMemo(
    () => members.reduce((m, x) => Math.max(m, x.memberNumber ?? 0), 0) + 1,
    [members]
  );

  useEffect(() => {
    if (open) {
      setFullName(member?.fullName ?? "");
      setPledge(member ? (member.monthlyPledgeCents / 100).toString() : "10");
      setMemberNumber(
        member?.memberNumber ? String(member.memberNumber) : String(nextMemberNumber)
      );
      setPhone(member?.phone ?? "");
      setNie(member?.nie ?? "");
      setConfirmOpen(false);
      setDeleteOpen(false);
    }
  }, [open, member, nextMemberNumber]);

  if (!open) return null;

  async function submit() {
    const cents = Math.round(Number(pledge) * 100);
    const num = Number(memberNumber);
    if (!fullName.trim() || !Number.isFinite(cents) || cents <= 0) return;
    if (!Number.isInteger(num) || num <= 0) return;
    await runAndInvalidate(async () => {
      const taken = members.some((m) => m.memberNumber === num && m.id !== member?.id);
      if (taken) throw new Error(t.memberNumberTaken);
      if (member) {
        await updateMember(member.id, {
          fullName: fullName.trim(),
          monthlyPledgeCents: cents,
          memberNumber: num,
          phone: phone.trim() || deleteField(),
          nie: nie.trim() || deleteField(),
        });
      } else {
        await recordMember({
          fullName: fullName.trim(),
          monthlyPledgeCents: cents,
          memberNumber: num,
          phone: phone.trim() || undefined,
          nie: nie.trim() || undefined,
        });
      }
      onClose();
    });
  }

  async function confirmArchive() {
    if (!member) return;
    await runAndInvalidate(async () => {
      await archiveMember(member.id);
      setConfirmOpen(false);
      onClose();
    });
  }

  async function handleUnarchive() {
    if (!member) return;
    await runAndInvalidate(async () => {
      await unarchiveMember(member.id);
      onClose();
    });
  }

  async function confirmDelete() {
    if (!member) return;
    await runAndInvalidate(async () => {
      await deleteMemberPermanent(member.id);
      setDeleteOpen(false);
      onClose();
    });
  }

  return (
    <>
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
            {member?.isActive === false && (
              <span className="ms-2 rounded bg-warning/20 px-1.5 py-0.5 text-xs text-warning">
                {t.archived}
              </span>
            )}
          </h2>

          <div className="mt-4 space-y-3">
            <Field label={t.name}>
              <input
                dir="auto"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t.memberNumber}>
              <input
                dir="ltr"
                inputMode="numeric"
                required
                value={memberNumber}
                onChange={(e) => setMemberNumber(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t.monthlyPledge}>
              <input
                dir="ltr"
                inputMode="decimal"
                required
                value={pledge}
                onChange={(e) => setPledge(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t.phone}>
              <input
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t.nieDni}>
              <input
                dir="ltr"
                value={nie}
                onChange={(e) => setNie(e.target.value)}
                className={inputClass}
              />
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
            {saved && <span className="text-sm text-success">{t.saved}</span>}
            {member && (
              member.isActive !== false ? (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className={ghostButtonClass}
                >
                  {t.archive}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleUnarchive}
                    className={buttonClass}
                  >
                    {t.unarchive}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="rounded-lg border border-danger/60 px-3 py-1.5 text-sm text-danger hover:bg-danger/10"
                  >
                    {t.permanentDelete}
                  </button>
                </>
              )
            )}
            <button type="button" onClick={onClose} className={ghostButtonClass}>
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={
                busy ||
                !fullName.trim() ||
                !Number.isInteger(Number(memberNumber)) ||
                Number(memberNumber) <= 0
              }
              className={buttonClass}
            >
              {busy ? t.saving : t.save}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        t={t}
        open={confirmOpen}
        title={t.archive}
        message={`${t.confirmDelete} ${member?.fullName ?? ""}`}
        busy={busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmArchive}
      />
      <ConfirmDialog
        t={t}
        open={deleteOpen}
        title={t.permanentDelete}
        message={`${t.confirmPermanentDelete} (${member?.fullName ?? ""})`}
        busy={busy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
