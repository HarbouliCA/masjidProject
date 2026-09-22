import { describe, it, expect } from "vitest";
import { formatEUR, parseEURToCents, isolateLTR } from "./money";

describe("formatEUR", () => {
  it("formats zero", () => {
    expect(formatEUR(0)).toBe("0,00 €");
  });

  it("formats cents", () => {
    expect(formatEUR(5)).toBe("0,05 €");
  });

  it("formats euros with grouping", () => {
    expect(formatEUR(123456)).toBe("1.234,56 €");
  });

  it("formats the reconciliation figure 14,661.00", () => {
    expect(formatEUR(1466100)).toBe("14.661,00 €");
  });

  it("formats a negative balance", () => {
    expect(formatEUR(-69954)).toBe("-699,54 €");
  });

  it("rounds sub-cent input to integer cents", () => {
    expect(formatEUR(1.5)).toBe("0,02 €");
  });

  it("formats a large value with full grouping", () => {
    expect(formatEUR(2501100)).toBe("25.011,00 €");
  });
});

describe("parseEURToCents", () => {
  it("parses a decimal point", () => {
    expect(parseEURToCents("1234.56")).toBe(123456);
  });

  it("parses a decimal comma", () => {
    expect(parseEURToCents("1234,56")).toBe(123456);
  });

  it("parses grouping plus comma", () => {
    expect(parseEURToCents("1.234,56")).toBe(123456);
  });

  it("parses an integer amount", () => {
    expect(parseEURToCents("1234")).toBe(123400);
  });

  it("parses a single decimal digit", () => {
    expect(parseEURToCents("1234.5")).toBe(123450);
  });

  it("parses a negative amount", () => {
    expect(parseEURToCents("-1234,56")).toBe(-123456);
  });

  it("round-trips through formatEUR", () => {
    expect(parseEURToCents(formatEUR(1131500))).toBe(1131500);
  });
});

describe("isolateLTR", () => {
  it("wraps a value in LTR isolate controls", () => {
    expect(isolateLTR("1.234,56 €")).toBe("\u20661.234,56 €\u2069");
  });
});
