import type { Cents, Settings } from "./schema";

export const DEFAULT_PRICING = {
  oneChild: 1000,
  twoChildren: 2000,
  threePlusChildren: 3000,
  englishPerChild: 1000,
} as const;

/**
 * Arabic fee is charged per child at €10 (1000 cents) * number of kids.
 */
export function arabicFeeCents(children: number, settings?: Settings | null): Cents {
  if (children <= 0) return 0;
  const pricing = settings?.pricing ?? DEFAULT_PRICING;
  const perChild = pricing.oneChild ?? 1000;
  return perChild * children;
}

export function englishFeeCents(englishChildren: number, settings?: Settings | null): Cents {
  const pricing = settings?.pricing ?? DEFAULT_PRICING;
  return pricing.englishPerChild * englishChildren;
}

export interface FeeAssessment {
  arabicFeeCents: Cents;
  englishFeeCents: Cents;
  totalCents: Cents;
  isManualOverride: boolean;
}

export function assessFees(
  arabicChildren: number,
  englishChildren: number,
  settings?: Settings | null,
  recordedTotalCents?: Cents
): FeeAssessment {
  const arabic = arabicFeeCents(arabicChildren, settings);
  const english = englishFeeCents(englishChildren, settings);
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