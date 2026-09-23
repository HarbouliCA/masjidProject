/**
 * Bootstrap an admin user (one-off). Uses the service-account key via
 * GOOGLE_APPLICATION_CREDENTIALS. Idempotent: re-running updates the password
 * and re-sets claims/profile without duplicating the Auth user.
 *
 * Usage: tsx scripts/create-admin.ts <email> <password>
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const email = process.argv[2]?.trim();
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: npx tsx scripts/create-admin.ts <email> <password>");
  process.exit(1);
}

const app = initializeApp({ projectId: "masjid-nour" });

async function main() {
  const auth = getAuth(app);
  let uid: string;

  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`User already exists: ${uid}`);
    await auth.updateUser(uid, { password });
  } catch {
    const user = await auth.createUser({ email, password });
    uid = user.uid;
    console.log(`Created user: ${uid}`);
  }

  await auth.setCustomUserClaims(uid, { role: "admin" });
  await getFirestore(app).collection("users").doc(uid).set({
    email,
    role: "admin",
    familyId: null,
    disabled: false,
  });

  console.log(`Admin role + profile set for ${email} (uid ${uid})`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
