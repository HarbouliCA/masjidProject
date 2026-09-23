"use server";

import { requireAdmin } from "../auth";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import type { UserRole } from "@/lib/schema";

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
  familyId?: string;
}

function claimsFor(role: UserRole, familyId?: string): Record<string, string> {
  return { role, ...(familyId ? { familyId } : {}) };
}

export async function createUserAction(idToken: string, input: CreateUserInput) {
  await requireAdmin(idToken);
  const auth = getAdminAuth();
  const email = input.email.trim();
  const user = await auth.createUser({ email, password: input.password });
  await auth.setCustomUserClaims(user.uid, claimsFor(input.role, input.familyId));
  await getAdminFirestore().collection("users").doc(user.uid).set({
    email,
    role: input.role,
    familyId: input.familyId ?? null,
    disabled: false,
  });
  return { uid: user.uid };
}

export async function resetPasswordAction(
  idToken: string,
  uid: string,
  newPassword: string
) {
  await requireAdmin(idToken);
  await getAdminAuth().updateUser(uid, { password: newPassword });
}

export async function setUserDisabledAction(
  idToken: string,
  uid: string,
  disabled: boolean
) {
  await requireAdmin(idToken);
  await getAdminAuth().updateUser(uid, { disabled });
  await getAdminFirestore().collection("users").doc(uid).set({ disabled }, { merge: true });
}

export async function setUserRoleAction(
  idToken: string,
  uid: string,
  role: UserRole,
  familyId?: string
) {
  await requireAdmin(idToken);
  await getAdminAuth().setCustomUserClaims(uid, claimsFor(role, familyId));
  await getAdminFirestore()
    .collection("users")
    .doc(uid)
    .set({ role, familyId: familyId ?? null }, { merge: true });
}
