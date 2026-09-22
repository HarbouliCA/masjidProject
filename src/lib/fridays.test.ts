import { describe, it, expect } from "vitest";
import { generateFridays } from "./fridays";

describe("generateFridays", () => {
  it("lists every Friday in January 2026", () => {
    const fridays = generateFridays("2026-01-01", "2026-01-31");
    expect(fridays.map((f) => f.date)).toEqual([
      "2026-01-02",
      "2026-01-09",
      "2026-01-16",
      "2026-01-23",
      "2026-01-30",
    ]);
  });

  it("annotates the Eid al-Fitr Friday (20 Mar 2026)", () => {
    const fridays = generateFridays("2026-03-01", "2026-03-31");
    const eid = fridays.find((f) => f.date === "2026-03-20");
    expect(eid?.eid).toBe("fitr");
  });

  it("does not flag a normal Friday as Eid", () => {
    const fridays = generateFridays("2026-01-01", "2026-12-31");
    const normal = fridays.find((f) => f.date === "2026-01-02");
    expect(normal?.eid).toBeNull();
  });

  it("Eid al-Adha 2026 (27 May) is not a Friday, so no 'adha' Friday exists", () => {
    const fridays = generateFridays("2026-01-01", "2026-12-31");
    expect(fridays.some((f) => f.eid === "adha")).toBe(false);
  });

  it("produces 52 Fridays in 2026", () => {
    expect(generateFridays("2026-01-01", "2026-12-31")).toHaveLength(52);
  });
});
