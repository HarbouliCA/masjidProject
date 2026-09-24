import { describe, it, expect } from "vitest";
import {
  DEFAULT_PRICING,
  arabicFeeFlatCents,
  assessFees,
} from "./fees";

describe("arabicFeeFlatCents", () => {
  it("charges €10 for 1 child", () => {
    expect(arabicFeeFlatCents(1)).toBe(DEFAULT_PRICING.oneChild);
  });

  it("charges €20 total for 2 children", () => {
    expect(arabicFeeFlatCents(2)).toBe(DEFAULT_PRICING.twoChildren);
  });

  it("charges €30 total for 3+ children", () => {
    expect(arabicFeeFlatCents(3)).toBe(DEFAULT_PRICING.threePlusChildren);
    expect(arabicFeeFlatCents(5)).toBe(DEFAULT_PRICING.threePlusChildren);
  });
});

describe("assessFees", () => {
  it("calculates 1 arabic + 1 english = €20", () => {
    expect(assessFees(1, 1)).toEqual({
      arabicFeeCents: 1000,
      englishFeeCents: 1000,
      totalCents: 2000,
      isManualOverride: false,
    });
  });

  it("calculates 3 arabic = €30", () => {
    expect(assessFees(3, 0).totalCents).toBe(3000);
  });

  it("calculates 2 arabic + 2 english = €40", () => {
    expect(assessFees(2, 2).totalCents).toBe(4000); // 20 + 20
  });

  it("calculates 4 arabic = €30", () => {
    expect(assessFees(4, 0).totalCents).toBe(3000);
  });

  it("flags anomaly if recorded total doesn't match", () => {
    const a = assessFees(2, 0, null, 2500); // Pass null for settings, 2500 for recordedTotal
    expect(a.totalCents).toBe(2000);
    expect(a.isManualOverride).toBe(true);
  });
});
