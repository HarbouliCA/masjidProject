"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { useAuth } from "@/lib/auth/useAuth";
import type { Dictionary } from "@/i18n";

export function AuthStatus({ t, locale }: { t: Dictionary; locale: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const auth = getFirebaseAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="max-w-[10rem] truncate text-xs text-muted" dir="ltr">
        {user.email}
      </span>
      <button
        type="button"
        onClick={async () => {
          if (auth) {
            await signOut(auth);
            router.replace(`/${locale}/login`);
          }
        }}
        className="rounded-lg border border-nour-gold-300/60 px-3 py-1.5 text-sm text-muted hover:text-nour-gold-600"
      >
        {t.logout}
      </button>
    </div>
  );
}
