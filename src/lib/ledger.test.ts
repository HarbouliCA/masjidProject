import { describe, it, expect } from "vitest";
import { deriveObligationStatus, remainingCents } from "./ledger";

describe("deriveObligationStatus", () => {
  it("is unpaid when nothing is paid", () => {
    expect(deriveObligationStatus(1000, 0)).toBe("unpaid");
  });

  it("is partial when partly paid", () => {
    expect(deriveObligationStatus(1000, 500)).toBe("partial");
  });

  it("is paid when fully paid", () => {
    expect(deriveObligationStatus(1000, 1000)).toBe("paid");
  });

  it("is paid when overpaid", () => {
    expect(deriveObligationStatus(1000, 1200)).toBe("paid");
  });

  it("is waived regardless of payment", () => {
    expect(deriveObligationStatus(1000, 0, true)).toBe("waived");
    expect(deriveObligationStatus(1000, 500, true)).toBe("waived");
  });
});

describe("remainingCents", () => {
  it("returns the outstanding balance", () => {
    expect(remainingCents(1000, 250)).toBe(750);
  });

  it("never returns a negative balance", () => {
    expect(remainingCents(1000, 1500)).toBe(0);
  });
});
