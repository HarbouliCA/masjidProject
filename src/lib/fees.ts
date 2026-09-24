import type { Cents, Settings } from "./schema";

export const DEFAULT_PRICING = {
  oneChild: 1000,
  twoChildren: 2000,
  threePlusChildren: 3000,
  englishPerChild: 1000,
} as const;

export function arabicFeeFlatCents(children: number, settings?: Settings | null): Cents {
  const pricing = settings?.pricing ?? DEFAULT_PRICING;
  if (children <= 0) return 0;
  if (children === 1) return pricing.oneChild;
  if (children === 2) return pricing.twoChildren;
  return pricing.threePlusChildren;
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
  const arabic = arabicFeeFlatCents(arabicChildren, settings);
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