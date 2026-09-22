/**
 * Deterministic date formatting — no bare Intl/ICU for Arabic output.
 *
 * We pin Latin digits and Arabic month names ourselves so digit systems
 * (٠١٢٣ vs 123) never vary by runtime. Calendar days are resolved in
 * Europe/Madrid, matching the community's timezone (plan §3.4).
 */

export const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

const madridFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
});

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface MadridDateParts {
  year: number;
  month: number;
  day: number;
  weekday: number;
}

/** Resolve the calendar date (and weekday) of a Date in Europe/Madrid. */
export function madridParts(date: Date): MadridDateParts {
  const parts = madridFormatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

/** "12 يناير 2026" — Latin digits, Arabic month name. */
export function formatDate(date: Date): string {
  const { year, month, day } = madridParts(date);
  return `${day} ${ARABIC_MONTHS[month - 1]} ${year}`;
}

/** "2026-01" — month keys are strings, never Date objects in IDs. */
export function formatMonthKey(date: Date): string {
  const { year, month } = madridParts(date);
  return `${year}-${month.toString().padStart(2, "0")}`;
}
