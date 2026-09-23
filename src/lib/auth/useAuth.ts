"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/auth";

export interface AuthUser {
  uid: string;
  email: string | null;
  role?: string;
  familyId?: string;
}

/**
 * Client auth state. Reads custom claims (role, familyId) from the ID token.
 * Returns null when Firebase is unconfigured (no env), so the app still renders.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, async (u: User | null) => {
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      const token = await u.getIdTokenResult(true);
      setUser({
        uid: u.uid,
        email: u.email,
        role: token.claims.role as string | undefined,
        familyId: token.claims.familyId as string | undefined,
      });
      setLoading(false);
    });
  }, []);

  async function getIdToken(): Promise<string | null> {
    const auth = getFirebaseAuth();
    if (!auth || !auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  }

  return { user, loading, getIdToken };
}
