/**
 * Association identity used on public-facing surfaces (donation page, receipts).
 *
 * Per plan §4, the IBAN lives in settings/organization — this module is the
 * interim fallback until that document is loaded; do not scatter these values
 * across components.
 */
export const ORGANIZATION = {
  iban: "ES63 2100 0081 9501 0176 0034",
  titular: "Comunitat Islàmica del Solsonès",
  concepto: "DONACIÓN",
} as const;
