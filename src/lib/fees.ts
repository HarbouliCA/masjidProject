/**
 * School fee pricing engine (plan §9.2, settings 20/18/15/10).
 *
 * Verified against the workbook: per-child Arabic fee with sibling discount
 * (1 child €20, 2 children €18, 3+ €15) + flat €10/child English surcharge.
 * Anomalies (e.g. a family charged the 1-child rate for 2 children) surface as
 * `isManualOverride` — never silently "corrected".
 */
import type { Cents } from "./schema";

export const PRICING = {
  oneChild: 2000,
  twoChildren: 1800,
  threePlusChildren: 1500,
  englishPerChild: 1000,
} as const;

export function arabicFeePerChildCents(children: number): Cents {
  if (children <= 1) return PRICING.oneChild;
  if (children === 2) return PRICING.twoChildren;
  return PRICING.threePlusChildren;
}

export function englishFeeCents(englishChildren: number): Cents {
  return PRICING.englishPerChild * englishChildren;
}

export interface FeeAssessment {
  arabicFeeCents: Cents;
  englishFeeCents: Cents;
  totalCents: Cents;
  isManualOverride: boolean;
}

/**
 * Assess the correct fee for a family and flag any recorded total that does not
 * match the pricing rule (plan §3 fee anomalies).
 */
export function assessFees(
  arabicChildren: number,
  englishChildren: number,
  recordedTotalCents?: Cents
): FeeAssessment {
  const arabic = arabicFeePerChildCents(arabicChildren) * arabicChildren;
  const english = englishFeeCents(englishChildren);
  const totalCents = arabic + english;
  const isManualOverride =
    recordedTotalCents !== undefined && recordedTotalCents !== totalCents;
  return {
    arabicFeeCents: arabic,
    englishFeeCents: english,
    totalCents,
    isManualOverride,
  };
}
