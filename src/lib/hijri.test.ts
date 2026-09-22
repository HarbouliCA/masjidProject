import { describe, it, expect } from "vitest";
import {
  gregorianToHijri,
  formatGregorianHijri,
  isFriday,
  isEidAlFitr,
  isEidAlAdha,
  isRamadan,
} from "./hijri";

describe("gregorianToHijri", () => {
  it("maps 1 Ramadan 1447 (daily collections start)", () => {
    expect(gregorianToHijri(new Date("2026-02-18T12:00:00Z"))).toEqual({
      year: 1447,
      month: 9,
      day: 1,
    });
  });

  it("maps Eid al-Fitr (1 Shawwal 1447)", () => {
    expect(gregorianToHijri(new Date("2026-03-20T12:00:00Z"))).toEqual({
      year: 1447,
      month: 10,
      day: 1,
    });
  });

  it("maps Eid al-Adha (10 Dhul-Hijjah 1447)", () => {
    expect(gregorianToHijri(new Date("2026-05-27T12:00:00Z"))).toEqual({
      year: 1447,
      month: 12,
      day: 10,
    });
  });
});

describe("isFriday", () => {
  it("marks Eid al-Fitr 2026 as a Friday (Eid-Friday zero)", () => {
    expect(isFriday(new Date("2026-03-20T12:00:00Z"))).toBe(true);
  });

  it("does not mark a Monday as Friday", () => {
    expect(isFriday(new Date("2026-03-23T12:00:00Z"))).toBe(false);
  });
});

describe("season detection", () => {
  it("detects a day inside Ramadan", () => {
    expect(isRamadan(new Date("2026-03-10T12:00:00Z"))).toBe(true);
  });

  it("detects Eid al-Fitr", () => {
    expect(isEidAlFitr(new Date("2026-03-20T12:00:00Z"))).toBe(true);
  });

  it("detects Eid al-Adha", () => {
    expect(isEidAlAdha(new Date("2026-05-27T12:00:00Z"))).toBe(true);
  });

  it("does not flag a non-Eid Friday as Eid al-Fitr", () => {
    expect(isEidAlFitr(new Date("2026-03-27T12:00:00Z"))).toBe(false);
  });
});

describe("formatGregorianHijri", () => {
  it("combines both calendars with the separator", () => {
    expect(formatGregorianHijri(new Date("2026-03-20T12:00:00Z"))).toBe(
      "20 مارس 2026 · 1 شوال 1447هـ"
    );
  });
});
