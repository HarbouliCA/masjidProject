import { stripTashkeel, unifyArabic } from "./matching";

/**
 * Normalizes a string for search:
 * 1. Strips Arabic diacritics and tatweel.
 * 2. Unifies Arabic letters (أ/إ/آ -> ا, ة -> ه, etc.).
 * 3. Lowercases Latin text.
 * 4. Collapses whitespace.
 */
export function normalizeForSearch(value: string): string {
  if (!value) return "";
  const stripped = stripTashkeel(value);
  const unified = unifyArabic(stripped);
  return unified.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Checks if a search query matches a target string.
 * The query is split into space-separated words. Every word in the query
 * must exist as a substring within the target (order independent).
 */
export function matchesSearch(query: string, target: string): boolean {
  if (!query.trim()) return true;
  const normalizedTarget = normalizeForSearch(target);
  const normalizedQueryWords = normalizeForSearch(query).split(" ");
  
  return normalizedQueryWords.every((word) => normalizedTarget.includes(word));
}
