import { ar, type Dictionary, type TranslationKey } from "./ar";
import { es } from "./es";
import { ca } from "./ca";

export type { Dictionary, TranslationKey };
export { ar, es, ca };

export type Locale = "ar" | "es" | "ca";

export const LOCALES: Locale[] = ["ar", "es", "ca"];
export const DEFAULT_LOCALE: Locale = "ar";

const dictionaries: Record<Locale, Dictionary> = { ar, es, ca };

export function isLocale(value: string): value is Locale {
  return (LOCALES as string[]).includes(value);
}

/** Direction derives from the active locale — never hardcoded elsewhere. */
export function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/**
 * Resolve the active locale. Phase 0 defaults to Arabic; full locale routing
 * (URL segment / cookie) lands in Phase 1+.
 */
export function getLocale(): Locale {
  return DEFAULT_LOCALE;
}
