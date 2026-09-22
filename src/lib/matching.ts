/**
 * Name matcher (plan §2.7 / §11.C). Normalizes Arabic (and Latin) names so
 * the same person spelled differently can be proposed as a match — never
 * auto-merged. Produces `matchConfidence: "proposed"` for humans to confirm.
 */

/** Strip tashkeel (diacritics) and tatweel (elongation). */
export function stripTashkeel(value: string): string {
  return value
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/\u0653/g, "");
}

/** Unify alef/hamza/taa-marbuta/yah variants. */
export function unifyArabic(value: string): string {
  return value
    .replace(/[أإآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

/** Normalize a name to a canonical key for matching. */
export function normalizeName(value: string): string {
  const stripped = stripTashkeel(clean(value));
  const unified = unifyArabic(stripped);
  // Remove the leading article "ال" so "الميلود" matches "ميلود".
  return unified.replace(/^ال/, "").replace(/\s+/g, " ").trim();
}

function clean(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[ *]+$/g, "")
    .trim();
}

export interface NameMatch {
  a: string;
  b: string;
  confidence: "exact" | "proposed";
  reason: string;
}

/**
 * Compare two names and return a match proposal.
 * Exact match on normalized key = confirmed; fuzzy variants (spacing/doubling/
 * article differences) = proposed.
 */
export function matchNames(a: string, b: string): NameMatch | null {
  const ka = normalizeName(a);
  const kb = normalizeName(b);
  if (!ka || !kb) return null;
  if (ka === kb) return { a, b, confidence: "exact", reason: "normalized-equal" };
  // Doubling / spacing variants: collapse repeated consonants heuristically.
  const squeeze = (s: string) => s.replace(/(.)\1+/g, "$1").replace(/\s+/g, "");
  if (squeeze(ka) === squeeze(kb)) {
    return { a, b, confidence: "proposed", reason: "spacing-or-doubling" };
  }
  return null;
}

/** Propose candidate matches for a name against a list of candidates. */
export function proposeMatches(
  name: string,
  candidates: string[]
): { candidate: string; confidence: "exact" | "proposed" }[] {
  const out: { candidate: string; confidence: "exact" | "proposed" }[] = [];
  for (const c of candidates) {
    const m = matchNames(name, c);
    if (m) out.push({ candidate: c, confidence: m.confidence });
  }
  return out;
}
