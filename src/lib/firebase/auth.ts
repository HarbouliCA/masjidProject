import { getAuth, type Auth } from "firebase/auth";
import { getFirebaseApp } from "./config";

/**
 * Custom claims (role, familyId) are the real security boundary — set via the
 * setUserRole callable on the backend, never trusted from client state.
 */
export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  return getAuth(app);
}

export type AppRole = "admin" | "treasurer" | "teacher" | "parent" | "viewer";

export interface AppClaims {
  role?: AppRole;
  familyId?: string;
}
