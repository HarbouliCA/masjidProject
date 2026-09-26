import { describe, it, expect } from "vitest";
import {
  DEFAULT_PRICING,
  arabicFeeCents,
  assessFees,
} from "./fees";
import type { Settings } from "./schema";

describe("arabicFeeCents", () => {
  it("charges €10 for 1 child", () => {
    expect(arabicFeeCents(1)).toBe(DEFAULT_PRICING.oneChild);
  });

  it("charges €40 for 2 children (€20 each)", () => {
    expect(arabicFeeCents(2)).toBe(DEFAULT_PRICING.twoChildren * 2);
  });

  it("charges €30 per child for 3+ children", () => {
    expect(arabicFeeCents(3)).toBe(DEFAULT_PRICING.threePlusChildren * 3);
    expect(arabicFeeCents(5)).toBe(DEFAULT_PRICING.threePlusChildren * 5);
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

  it("calculates 2 arabic = €40 (20 * 2)", () => {
    expect(assessFees(2, 0).totalCents).toBe(4000);
  });

  it("calculates 2 arabic + 2 english = €60", () => {
    expect(assessFees(2, 2).totalCents).toBe(6000); // 40 + 20
  });

  it("calculates 4 arabic = €120 (30 * 4)", () => {
    expect(assessFees(4, 0).totalCents).toBe(12000);
  });

  it("flags anomaly if recorded total doesn't match", () => {
    const a = assessFees(2, 0, null, 2500); // Pass null for settings, 2500 for recordedTotal
    expect(a.totalCents).toBe(4000);
    expect(a.isManualOverride).toBe(true);
  });
});

describe("custom settings", () => {
  const settings: Settings = {
    pricing: {
      oneChild: 1500,
      twoChildren: 2500,
      threePlusChildren: 3500,
      englishPerChild: 1200,
    },
    organization: {
      iban: "",
      titular: "",
      concepto: "",
      fiscalYear: "2026",
      openingBalances: { masjid: 0, school: 0 },
    },
  };

  it("uses the settings pricing instead of defaults", () => {
    expect(arabicFeeCents(2, settings)).toBe(2500 * 2);
    expect(assessFees(2, 1, settings).totalCents).toBe(2500 * 2 + 1200);
  });

  it("reflects a changed setting value", () => {
    const changed: Settings = {
      ...settings,
      pricing: { ...settings.pricing, twoChildren: 4000 },
    };
    expect(assessFees(2, 0, settings).totalCents).toBe(5000);
    expect(assessFees(2, 0, changed).totalCents).toBe(8000);
  });
});
