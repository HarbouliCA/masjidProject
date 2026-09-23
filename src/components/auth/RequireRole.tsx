"use client";

import { useAuth } from "@/lib/auth/useAuth";

/**
 * UI gate. Renders children only when the signed-in user has one of the given
 * roles. This is NOT a security boundary — server actions and Firestore rules
 * enforce the real access — but it keeps unauthorized users from seeing admin UI.
 */
export function RequireRole({
  roles,
  children,
  fallback = null,
}: {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) return fallback;
  if (!user) return fallback;
  if (user.role && roles.includes(user.role)) return <>{children}</>;
  return fallback;
}
