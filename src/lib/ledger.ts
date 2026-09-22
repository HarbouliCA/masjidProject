/**
 * Ledger primitives — obligations vs. movements (plan §6).
 *
 * Status on an obligation (invoice, pledgeMonth) is always DERIVED from
 * expected vs. paid, never typed by hand.
 */
import type { Cents } from "./schema";

export type ObligationStatus = "unpaid" | "partial" | "paid" | "waived";

export function deriveObligationStatus(
  expectedCents: Cents,
  paidCents: Cents,
  waived = false
): ObligationStatus {
  if (waived) return "waived";
  if (paidCents <= 0) return "unpaid";
  if (paidCents >= expectedCents) return "paid";
  return "partial";
}

/** Whether an obligation has any remaining balance to collect. */
export function remainingCents(
  expectedCents: Cents,
  paidCents: Cents
): Cents {
  return Math.max(0, expectedCents - paidCents);
}
