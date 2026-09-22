import { describe, it, expect } from "vitest";
import {
  buildPayment,
  buildDonation,
  buildExpense,
  buildTransfer,
} from "./mutations";

describe("buildPayment", () => {
  it("builds an append-only payment document", () => {
    const p = buildPayment({
      scope: "school",
      againstType: "invoice",
      againstId: "inv-1",
      familyId: "fam-1",
      amountCents: 4500,
      method: "cash",
      receivedByUid: "u1",
    });
    expect(p.against).toEqual({ type: "invoice", id: "inv-1" });
    expect(p.amountCents).toBe(4500);
    expect(p.paidAt).toBeTruthy();
  });

  it("rejects a zero or negative amount", () => {
    const base = { scope: "school" as const, againstType: "invoice" as const, againstId: "x", amountCents: 0, method: "cash" as const, receivedByUid: "u" };
    expect(() => buildPayment(base)).toThrow();
  });

  it("rejects a non-integer amount (never floats)", () => {
    const base = { scope: "school" as const, againstType: "invoice" as const, againstId: "x", amountCents: 10.5, method: "cash" as const, receivedByUid: "u" };
    expect(() => buildPayment(base)).toThrow();
  });
});

describe("buildDonation", () => {
  it("builds a donation with a channel", () => {
    const d = buildDonation({ amountCents: 1000, channel: "friday_box", donorType: "box" });
    expect(d.channel).toBe("friday_box");
    expect(d.date).toBeTruthy();
  });

  it("rejects a negative donation", () => {
    expect(() => buildDonation({ amountCents: -1, channel: "direct", donorType: "individual" })).toThrow();
  });
});

describe("buildExpense", () => {
  it("builds an expense with a category", () => {
    const e = buildExpense({ scope: "masjid", description: "gasoil", amountCents: 50000, category: "utilities" });
    expect(e.category).toBe("utilities");
    expect(e.amountCents).toBe(50000);
  });
});

describe("buildTransfer", () => {
  it("builds a school→masjid transfer", () => {
    const tr = buildTransfer({ fromScope: "school", toScope: "masjid", amountCents: 92100 });
    expect(tr.fromScope).toBe("school");
    expect(tr.toScope).toBe("masjid");
  });

  it("rejects a zero transfer", () => {
    expect(() => buildTransfer({ fromScope: "school", toScope: "masjid", amountCents: 0 })).toThrow();
  });
});
