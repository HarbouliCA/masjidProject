import { describe, it, expect } from "vitest";
import { serialToISO, toMoneyCents, toInt, cleanArabic } from "./excel";

describe("serialToISO", () => {
  it("converts an Excel serial to an ISO date", () => {
    expect(serialToISO(46039)).toBe("2026-01-17");
    expect(serialToISO(46024)).toBe("2026-01-02");
    expect(serialToISO(45909)).toBe("2025-09-09");
  });
});

describe("toMoneyCents", () => {
  it("recovers a text-formatted decimal cell (€3.60 bug)", () => {
    expect(toMoneyCents("3.60")).toBe(360);
  });

  it("parses a numeric amount", () => {
    expect(toMoneyCents(20)).toBe(2000);
  });

  it("parses a decimal number", () => {
    expect(toMoneyCents(112.96)).toBe(11296);
  });

  it("parses grouping plus comma", () => {
    expect(toMoneyCents("1.234,56")).toBe(123456);
  });

  it("returns null for empty input", () => {
    expect(toMoneyCents("")).toBeNull();
  });
});

describe("toInt", () => {
  it("parses integers", () => {
    expect(toInt(70)).toBe(70);
  });

  it("returns null for empty", () => {
    expect(toInt("")).toBeNull();
  });
});

describe("cleanArabic", () => {
  it("trims and collapses whitespace", () => {
    expect(cleanArabic("  محمد   بوصحابة ")).toBe("محمد بوصحابة");
  });

  it("strips trailing noise characters", () => {
    expect(cleanArabic("عبد الحافظ المحاسني x")).toBe("عبد الحافظ المحاسني x");
    expect(cleanArabic("مصطفى *")).toBe("مصطفى");
  });
});
