/**
 * Hijri layer — built on @umalqura/core, with deterministic Arabic output.
 *
 * The library reads a Date's local components, so we first resolve the calendar
 * day in Europe/Madrid, then build a local-noon Date from those parts to get a
 * stable, timezone-independent Hijri conversion. Month names and digits are
 * pinned here (never bare Intl), with Latin digits for financial clarity.
 */

import umalqura from "@umalqura/core";
import { madridParts, formatDate } from "./dates";

export const HIJRI_MONTHS = [
  "المحرم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
] as const;

export interface HijriParts {
  year: number;
  month: number;
  day: number;
}

/** Convert a Gregorian Date to Hijri (year/month/day), resolved in Europe/Madrid. */
export function gregorianToHijri(date: Date): HijriParts {
  const { year, month, day } = madridParts(date);
  const localNoon = new Date(year, month - 1, day, 12, 0, 0, 0);
  const { hy, hm, hd } = umalqura.$.gregorianToHijri(localNoon);
  return { year: hy, month: hm, day: hd };
}

/** "1 شوال 1447هـ" — Latin digits, Arabic Hijri month name. */
export function formatHijri(date: Date): string {
  const { year, month, day } = gregorianToHijri(date);
  return `${day} ${HIJRI_MONTHS[month - 1]} ${year}هـ`;
}

/** "20 مارس 2026 · 1 شوال 1447هـ" — Gregorian alongside Hijri. */
export function formatGregorianHijri(date: Date): string {
  return `${formatDate(date)} · ${formatHijri(date)}`;
}

/** Whether the Madrid calendar day is a Friday (Jumuah). */
export function isFriday(date: Date): boolean {
  return madridParts(date).weekday === 5;
}

/** 1 Shawwal — Eid al-Fitr. */
export function isEidAlFitr(date: Date): boolean {
  const h = gregorianToHijri(date);
  return h.month === 10 && h.day === 1;
}

/** 10 Dhul-Hijjah — Eid al-Adha. */
export function isEidAlAdha(date: Date): boolean {
  const h = gregorianToHijri(date);
  return h.month === 12 && h.day === 10;
}

/** True while the Madrid day falls in Ramadan (Hijri month 9). */
export function isRamadan(date: Date): boolean {
  const h = gregorianToHijri(date);
  return h.month === 9;
}
