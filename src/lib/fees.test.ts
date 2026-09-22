import { describe, it, expect } from "vitest";
import {
  PRICING,
  arabicFeePerChildCents,
  assessFees,
} from "./fees";

describe("arabicFeePerChildCents", () => {
  it("charges €20 for 1 child", () => {
    expect(arabicFeePerChildCents(1)).toBe(PRICING.oneChild);
  });

  it("charges €18 per child for 2 children", () => {
    expect(arabicFeePerChildCents(2)).toBe(PRICING.twoChildren);
  });

  it("charges €15 per child for 3+ children", () => {
    expect(arabicFeePerChildCents(3)).toBe(PRICING.threePlusChildren);
    expect(arabicFeePerChildCents(5)).toBe(PRICING.threePlusChildren);
  });
});

describe("assessFees", () => {
  it("matches the workbook: 1 arabic + 1 english = €30", () => {
    expect(assessFees(1, 1)).toEqual({
      arabicFeeCents: 2000,
      englishFeeCents: 1000,
      totalCents: 3000,
      isManualOverride: false,
    });
  });

  it("matches the workbook: 3 arabic = €45", () => {
    expect(assessFees(3, 0).totalCents).toBe(4500);
  });

  it("matches the workbook: 2 arabic + 2 english = €56", () => {
    expect(assessFees(2, 2).totalCents).toBe(5600);
  });

  it("matches the workbook: 4 arabic = €60", () => {
    expect(assessFees(4, 0).totalCents).toBe(6000);
  });

  it("flags the سعيد جيحي anomaly (2 children charged €20)", () => {
    const a = assessFees(2, 0, 2000);
    expect(a.totalCents).toBe(3600);
    expect(a.isManualOverride).toBe(true);
  });

  it("flags the منعم البشيري anomaly (1 child charged €36)", () => {
    const a = assessFees(1, 0, 3600);
    expect(a.totalCents).toBe(2000);
    expect(a.isManualOverride).toBe(true);
  });
});
