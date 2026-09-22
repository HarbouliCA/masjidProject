import { madridParts } from "./dates";
import { isFriday, isEidAlFitr, isEidAlAdha } from "./hijri";

export interface Friday {
  date: string; // "YYYY-MM-DD" in Europe/Madrid
  eid: "fitr" | "adha" | null;
}

function madridISO(date: Date): string {
  const { year, month, day } = madridParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Every Jumuah in a range (inclusive), each annotated with any Eid that fell on
 * it. Eid Fridays are expected-zero collection days (plan §2.4 / §9.3.3).
 */
export function generateFridays(startISO: string, endISO: string): Friday[] {
  const fridays: Friday[] = [];
  const cursor = new Date(`${startISO}T12:00:00Z`);
  const end = new Date(`${endISO}T12:00:00Z`);
  while (cursor <= end) {
    if (isFriday(cursor)) {
      const eid = isEidAlFitr(cursor) ? "fitr" : isEidAlAdha(cursor) ? "adha" : null;
      fridays.push({ date: madridISO(cursor), eid });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return fridays;
}
