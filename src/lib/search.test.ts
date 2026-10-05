import { describe, it, expect } from "vitest";
import { normalizeForSearch, matchesSearch } from "./search";

describe("normalizeForSearch", () => {
  it("normalizes Arabic text", () => {
    expect(normalizeForSearch("أَحْمَد")).toBe("احمد");
    expect(normalizeForSearch("مُحَمَّد")).toBe("محمد");
    expect(normalizeForSearch("آمنة")).toBe("امنه");
    expect(normalizeForSearch("مصطفى")).toBe("مصطفي");
  });

  it("lowercases Latin text", () => {
    expect(normalizeForSearch("Diyalo Abdolah")).toBe("diyalo abdolah");
  });

  it("collapses whitespace", () => {
    expect(normalizeForSearch("  عبد   الرحمن  ")).toBe("عبد الرحمن");
  });
});

describe("matchesSearch", () => {
  it("matches substring regardless of word order", () => {
    expect(matchesSearch("عبد الله", "عبد الله محمد")).toBe(true);
    expect(matchesSearch("محمد عبد", "عبد الله محمد")).toBe(true);
    expect(matchesSearch("الله عبد", "عبد الله محمد")).toBe(true);
  });

  it("matches normalized variations", () => {
    expect(matchesSearch("أحمد", "احمد")).toBe(true);
    expect(matchesSearch("عبدالرحمن", "عَبْدُالرَّحْمَنِ")).toBe(true);
    expect(matchesSearch("diyalo", "Diyalo Abdolah")).toBe(true);
  });

  it("returns false if any word is missing", () => {
    expect(matchesSearch("محمد علي", "محمد عبد الله")).toBe(false);
  });

  it("returns true for empty query", () => {
    expect(matchesSearch("", "محمد")).toBe(true);
    expect(matchesSearch("  ", "محمد")).toBe(true);
  });
});
