"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";

/** Paths reachable without authentication. */
const PUBLIC_SEGMENTS = ["login", "donate"];

export function RequireAuth({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const segment = pathname.split("/").filter(Boolean).pop() ?? "";
  const isPublic = PUBLIC_SEGMENTS.includes(segment);

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublic) {
        router.replace(`/${locale}/login`);
      } else if (user && segment === "login") {
        router.replace(`/${locale}`);
      }
    }
  }, [loading, user, isPublic, segment, locale, router]);

  if (loading) {
    return <div className="py-24 text-center text-sm text-muted">…</div>;
  }
  if (!user && !isPublic) return null; // redirecting
  if (user && segment === "login") return null; // redirecting
  return <>{children}</>;
}
