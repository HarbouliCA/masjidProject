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
      <span className="max-w-[7rem] sm:max-w-[12rem] truncate text-xs font-medium text-foreground/75" dir="ltr">
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
        className="inline-flex items-center rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs sm:text-sm font-medium text-foreground/90 shadow-xs hover:bg-surface-hover hover:text-foreground hover:border-nour-gold-500/50 transition-colors"
      >
        {t.logout}
      </button>
    </div>
  );
}
