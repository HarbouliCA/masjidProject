/**
 * Server-side authorization — verify a Firebase ID token and enforce roles.
 * Every privileged server action MUST call requireAdmin / requireRole, never
 * trust the client.
 */
import "server-only";
import { getAdminAuth } from "@/lib/firebase/admin";

export interface AuthContext {
  uid: string;
  role?: string;
  familyId?: string;
}

export async function verifyIdToken(idToken: string): Promise<AuthContext> {
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(idToken);
  return { uid: decoded.uid, role: decoded.role, familyId: decoded.familyId };
}

export async function requireAdmin(idToken: string): Promise<AuthContext> {
  const ctx = await verifyIdToken(idToken);
  if (ctx.role !== "admin") {
    throw new Error("Forbidden: admin role required");
  }
  return ctx;
}

export async function requireStaff(idToken: string): Promise<AuthContext> {
  const ctx = await verifyIdToken(idToken);
  if (ctx.role !== "admin" && ctx.role !== "treasurer" && ctx.role !== "teacher") {
    throw new Error("Forbidden: staff role required");
  }
  return ctx;
}
