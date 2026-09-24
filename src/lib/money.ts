/**
 * Money handling — الأمانة.
 *
 * All monetary values are integer cents, never floats. Display formatting uses
 * Latin digits with European grouping ("1.234,56 €") and must always be
 * bidi-isolated when embedded next to Arabic text (see <Money> component).
 */

const eurGroupFormatter = new Intl.NumberFormat("de-DE");

/** Format integer cents as a European-style euro string, e.g. 123456 -> "1.234,56 €". */
export function formatEUR(cents: number): string {
  if (!Number.isFinite(cents)) return "—";
  const rounded = Math.round(cents);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  const frac = abs % 100;
  const whole = (abs - frac) / 100;
  const grouped = eurGroupFormatter.format(whole);
  const fracStr = frac.toString().padStart(2, "0");
  return `${sign}${grouped},${fracStr} €`;
}

/**
 * Parse a user-entered euro string into integer cents.
 * Accepts "1234", "1234.56", "1234,56" and "1.234,56" (grouping + comma).
 * Also normalizes Arabic-Indic/Persian digits (٠-٩ / ۰-۹) and the Arabic
 * decimal separator (٫) so an Arabic-keyboard entry still parses correctly.
 */
export function parseEURToCents(input: string): number {
  const normalized = input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");

  const cleaned = normalized
    .trim()
    .replace(/€/g, "")
    .replace(/\s/g, "");
  if (!cleaned || !/\d/.test(cleaned)) return 0;

  const sign = cleaned.startsWith("-") ? -1 : 1;
  const unsigned = cleaned.replace(/^-/, "");

  const lastComma = unsigned.lastIndexOf(",");
  const lastDot = unsigned.lastIndexOf(".");
  const hasSeparator = lastComma !== -1 || lastDot !== -1;

  let wholeStr = unsigned;
  let fracStr = "";
  if (hasSeparator) {
    const sepIndex = lastComma > lastDot ? lastComma : lastDot;
    wholeStr = unsigned.slice(0, sepIndex);
    fracStr = unsigned.slice(sepIndex + 1);
  }

  const whole = Number(wholeStr.replace(/[.,]/g, "")) || 0;
  const frac = fracStr ? Number(fracStr.padEnd(2, "0").slice(0, 2)) || 0 : 0;

  return sign * (whole * 100 + frac);
}

/** Wrap a value in Unicode LTR isolate controls so it never scrambles in RTL prose. */
export function isolateLTR(value: string): string {
  return `\u2066${value}\u2069`;
}
