import { describe, it, expect } from "vitest";
import {
  normalizeName,
  matchNames,
  stripTashkeel,
  unifyArabic,
} from "./matching";

describe("normalizeName", () => {
  it("strips tashkeel and tatweel", () => {
    expect(stripTashkeel("مُحَمَّد")).toBe("محمد");
    expect(stripTashkeel("الـعـرب")).toBe("العرب");
  });

  it("unifies alef/hamza variants", () => {
    expect(unifyArabic("أحمد")).toBe("احمد");
    expect(unifyArabic("إبراهيم")).toBe("ابراهيم");
    expect(unifyArabic("آمنة")).toBe("امنه");
  });

  it("removes the leading article for matching", () => {
    expect(normalizeName("الميلود قاسمي")).toBe(normalizeName("ميلود قاسمي"));
  });
});

describe("matchNames", () => {
  it("matches identical names exactly", () => {
    const m = matchNames("محمد بوصحابة", "محمد بوصحابة");
    expect(m?.confidence).toBe("exact");
  });

  it("proposes a spacing variant", () => {
    const m = matchNames("عبد القادرمداح", "عبد القادر مداح");
    expect(m?.confidence).toBe("proposed");
  });

  it("proposes a spacing variant (missing space)", () => {
    const m = matchNames("عمركروم", "عمر كروم");
    expect(m?.confidence).toBe("proposed");
  });

  it("matches article variants (normalized-equal)", () => {
    const m = matchNames("الميلود قاسمي", "ميلود قاسمي");
    expect(m).not.toBeNull();
  });

  it("returns null for unrelated names", () => {
    expect(matchNames("محمد", "عبد الرحمن")).toBeNull();
  });
});
