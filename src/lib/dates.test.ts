import { describe, it, expect } from "vitest";
import { ARABIC_MONTHS, formatDate, formatMonthKey } from "./dates";

describe("formatDate", () => {
  it("formats a January date with Latin digits", () => {
    expect(formatDate(new Date("2026-01-12T12:00:00Z"))).toBe("12 يناير 2026");
  });

  it("formats a December date", () => {
    expect(formatDate(new Date("2026-12-05T12:00:00Z"))).toBe("5 ديسمبر 2026");
  });

  it("formats a single-digit day without zero padding", () => {
    expect(formatDate(new Date("2026-03-07T12:00:00Z"))).toBe("7 مارس 2026");
  });
});

describe("formatMonthKey", () => {
  it("zero-pads single-digit months", () => {
    expect(formatMonthKey(new Date("2026-01-15T12:00:00Z"))).toBe("2026-01");
  });

  it("keeps double-digit months", () => {
    expect(formatMonthKey(new Date("2026-11-15T12:00:00Z"))).toBe("2026-11");
  });
});

describe("ARABIC_MONTHS", () => {
  it("has exactly 12 entries", () => {
    expect(ARABIC_MONTHS).toHaveLength(12);
  });

  it("starts with يناير and ends with ديسمبر", () => {
    expect(ARABIC_MONTHS[0]).toBe("يناير");
    expect(ARABIC_MONTHS[11]).toBe("ديسمبر");
  });
});
