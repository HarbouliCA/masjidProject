/**
 * Deploy Firestore security rules (firestore.rules) to the live project.
 * Uses the service account via GOOGLE_APPLICATION_CREDENTIALS or
 * FIREBASE_SERVICE_ACCOUNT (same convention as scripts/import-excel.ts).
 *
 *   npx tsx scripts/deploy-rules.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getSecurityRules } from "firebase-admin/security-rules";

async function main() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const app = raw
    ? initializeApp({ credential: cert(JSON.parse(raw)) })
    : initializeApp(); // Application Default Credentials

  const source = readFileSync(resolve(__dirname, "..", "firestore.rules"), "utf8");
  const rules = getSecurityRules(app);
  const released = await rules.releaseFirestoreRulesetFromSource(source);
  console.log("Released Firestore ruleset:", released.name);
}

main().catch((e) => {
  console.error("Deploy failed:", e);
  process.exit(1);
});
