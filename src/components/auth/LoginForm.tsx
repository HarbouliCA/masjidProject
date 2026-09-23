"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { useAuth } from "@/lib/auth/useAuth";
import { Field, inputClass, buttonClass } from "../forms/shared";
import type { Dictionary } from "@/i18n";

export function LoginForm({ t, locale }: { t: Dictionary; locale: string }) {
  const auth = getFirebaseAuth();
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!auth) {
    return (
      <p className="py-12 text-center text-sm text-muted">
        {t.error}: Firebase is not configured.
      </p>
    );
  }
  const firebaseAuth = auth;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      router.push(`/${locale}`);
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">{user.email}</span>
        <button
          type="button"
          onClick={async () => {
            await signOut(firebaseAuth);
            router.refresh();
          }}
          className={buttonClass}
        >
          {t.logout}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm rounded-xl border border-nour-gold-300/40 bg-surface p-6">
      <h1 className="font-heading text-lg font-semibold">{t.login}</h1>
      <div className="mt-4 space-y-3">
        <Field label={t.email}>
          <input dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <Field label={t.password}>
          <input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
      <button type="button" onClick={submit} disabled={busy} className={`${buttonClass} mt-4 w-full`}>
        {t.login}
      </button>
    </div>
  );
}
