import { describe, it, expect } from "vitest";
import { computeTreasury } from "./treasury";
import type { Donation, Expense, Payment, PledgeMonth, Transfer } from "./schema";

const pm = (paidCents: number): PledgeMonth => ({
  id: "pm", memberId: "m", month: "2026-01", expectedCents: 1000, paidCents, status: "paid", notes: "",
});
const donation = (amountCents: number): Donation => ({
  id: "d", date: "2026-01-01", amountCents, method: "cash", channel: "direct", donorType: "individual", receiptIssued: false, notes: "",
});
const expense = (scope: "masjid" | "school", amountCents: number): Expense => ({
  id: "e", scope, date: "2026-01-01", description: "", amountCents, category: "other", observation: "", createdByUid: "t",
});
const payment = (scope: "school", amountCents: number): Payment => ({
  id: "p", scope, against: { type: "invoice", id: "i" }, amountCents, paidAt: "", method: "cash", receivedByUid: "t",
});
const transfer = (fromScope: "school", toScope: "masjid", amountCents: number): Transfer => ({
  id: "t", fromScope, toScope, amountCents, date: "", createdByUid: "t", notes: "",
});

describe("computeTreasury", () => {
  it("eliminates transfers in the consolidated P&L", () => {
    const t = computeTreasury({
      pledgeMonths: [pm(100000)],
      donations: [],
      payments: [payment("school", 20000)],
      expenses: [expense("masjid", 10000), expense("school", 5000)],
      transfers: [transfer("school", "masjid", 7000)],
    });

    expect(t.masjid.transfersInCents).toBe(7000);
    expect(t.school.transfersOutCents).toBe(7000);
    expect(t.school.netCents).toBe(20000 - 5000 - 7000);
    expect(t.masjid.netCents).toBe(100000 + 7000 - 10000);
    // Consolidated: no transfer terms.
    expect(t.consolidated.netCents).toBe(100000 + 20000 - 10000 - 5000);
  });

  it("computes the reconciled 2026 position", () => {
    const t = computeTreasury({
      pledgeMonths: [pm(1131500)], // pledges collected €11,315
      donations: [donation(1466584), donation(575000)], // €14,665.84 + Friday €5,750
      payments: [payment("school", 70700)], // €707
      expenses: [expense("masjid", 672003), expense("school", 37754)], // €6,720.03 + €377.54
      transfers: [transfer("school", "masjid", 123100)], // €1,231
    });

    expect(t.masjid.incomeCents).toBe(1131500 + 1466584 + 575000);
    expect(t.masjid.expensesCents).toBe(672003);
    expect(t.masjid.transfersInCents).toBe(123100);
    expect(t.school.netCents).toBe(70700 - 37754 - 123100);
    expect(t.consolidated.netCents).toBe(
      1131500 + 1466584 + 575000 + 70700 - 672003 - 37754
    );
  });
});
