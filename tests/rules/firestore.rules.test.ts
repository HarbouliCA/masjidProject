/**
 * Security rules unit tests — run under the Firestore emulator:
 *   npm run test:rules   (requires `firebase-tools` + Java emulator)
 *
 * Proves the plan §7 guarantees: a parent cannot read another family's
 * invoice; a teacher cannot read pledge data; payments reject update/delete;
 * and unauthenticated clients are blocked by the catch-all.
 *
 * Note: `RulesTestContext.firestore()` returns the compat (v8) Firestore API,
 * so the tests use `db.collection(...).doc(...)` style calls.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, afterAll, beforeEach, describe, it } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
  type RulesTestContext,
} from "@firebase/rules-unit-testing";

const PROJECT_ID = "masjid-nour";
const RULES = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8");

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES },
  });
});

afterAll(async () => {
  await env.cleanup();
});

async function seed(ctx: RulesTestContext) {
  const db = ctx.firestore();
  await db.collection("invoices").doc("inv-famA").set({ familyId: "famA", totalCents: 4500 });
  await db.collection("invoices").doc("inv-famB").set({ familyId: "famB", totalCents: 4500 });
  await db.collection("pledgeMonths").doc("pm-1").set({ memberId: "m1", month: "2026-01", paidCents: 1000 });
  await db.collection("payments").doc("pay-1").set({ scope: "school", familyId: "famA", amountCents: 4500 });
  await db.collection("donations").doc("d1").set({ amountCents: 1000 });
}

describe("security rules", () => {
  beforeEach(async () => {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await seed(ctx);
    });
  });

  it("a parent cannot read another family's invoice", async () => {
    const db = env
      .authenticatedContext("p-famB", { role: "parent", familyId: "famB" })
      .firestore();
    await assertFails(db.collection("invoices").doc("inv-famA").get());
  });

  it("a parent can read their own family's invoice", async () => {
    const db = env
      .authenticatedContext("p-famA", { role: "parent", familyId: "famA" })
      .firestore();
    await assertSucceeds(db.collection("invoices").doc("inv-famA").get());
  });

  it("a teacher cannot read pledgeMonths", async () => {
    const db = env.authenticatedContext("t1", { role: "teacher" }).firestore();
    await assertFails(db.collection("pledgeMonths").doc("pm-1").get());
  });

  it("a teacher cannot read donations", async () => {
    const db = env.authenticatedContext("t1", { role: "teacher" }).firestore();
    await assertFails(db.collection("donations").doc("d1").get());
  });

  it("payments reject updates (append-only)", async () => {
    const db = env.authenticatedContext("tr1", { role: "treasurer" }).firestore();
    await assertFails(db.collection("payments").doc("pay-1").update({ amountCents: 1 }));
  });

  it("payments reject deletes (append-only)", async () => {
    const db = env.authenticatedContext("tr1", { role: "treasurer" }).firestore();
    await assertFails(db.collection("payments").doc("pay-1").delete());
  });

  it("an unauthenticated client cannot read anything", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(db.collection("invoices").doc("inv-famA").get());
  });
});
