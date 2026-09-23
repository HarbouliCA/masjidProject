"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCollection } from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/useAuth";
import {
  createUserAction,
  resetPasswordAction,
  setUserDisabledAction,
} from "@/server/actions/users";
import { Field, inputClass, buttonClass, ghostButtonClass } from "../forms/shared";
import type { Dictionary, TranslationKey } from "@/i18n";
import type { UserProfile, UserRole } from "@/lib/schema";

const ROLES: UserRole[] = ["admin", "treasurer", "teacher", "parent", "viewer"];

const roleKey: Record<UserRole, TranslationKey> = {
  admin: "roleAdmin",
  treasurer: "roleTreasurer",
  teacher: "roleTeacher",
  parent: "roleParent",
  viewer: "roleViewer",
};

export function UsersManager({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useCollection<UserProfile>("users");
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const token = await getIdToken();
    if (!token) {
      setError(t.login);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createUserAction(token, { email, password, role });
      queryClient.invalidateQueries();
      setShowForm(false);
      setEmail("");
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  async function reset(uid: string) {
    const next = window.prompt(t.resetPassword);
    if (!next) return;
    const token = await getIdToken();
    if (!token) return;
    await resetPasswordAction(token, uid, next);
  }

  async function toggleDisabled(p: UserProfile) {
    const token = await getIdToken();
    if (!token) return;
    await setUserDisabledAction(token, p.id, !p.disabled);
    queryClient.invalidateQueries();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => setShowForm((v) => !v)} className={buttonClass}>
          {t.add}
        </button>
      </div>

      {showForm && (
        <div className="space-y-2 rounded-xl border border-nour-gold-300/40 bg-surface p-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label={t.email}>
              <input dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </Field>
            <Field label={t.password}>
              <input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            </Field>
            <Field label={t.role}>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={inputClass}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{t[roleKey[r]]}</option>
                ))}
              </select>
            </Field>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className={ghostButtonClass}>
              {t.cancel}
            </button>
            <button type="button" onClick={submit} disabled={busy} className={buttonClass}>
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
                <th className="px-4 py-3 text-start font-medium">{t.email}</th>
                <th className="px-4 py-3 text-start font-medium">{t.role}</th>
                <th className="px-4 py-3 text-start font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-b border-nour-gold-300/20 last:border-0">
                  <td className="px-4 py-3">
                    <span dir="ltr">{u.email}</span>
                  </td>
                  <td className="px-4 py-3">{t[roleKey[u.role]]}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => reset(u.id)} className={ghostButtonClass}>
                        {t.resetPassword}
                      </button>
                      <button type="button" onClick={() => toggleDisabled(u)} className={ghostButtonClass}>
                        {u.disabled ? t.enable : t.disable}
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
