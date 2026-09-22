/**
 * Excel reading helpers (SheetJS). All parsing is grounded in the actual
 * workbook layout — nothing is invented (plan §11).
 */
import * as XLSX from "xlsx";
import { parseEURToCents } from "./money";

export type Row = unknown[];

export function readWorkbook(path: string): XLSX.WorkBook {
  return XLSX.readFile(path);
}

export function readRows(ws: XLSX.WorkSheet): Row[] {
  return XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: "", raw: true });
}

/**
 * Excel stores dates as serial numbers (days since 1899-12-30, 1900 system).
 * Convert to a Date (UTC) and to an ISO "YYYY-MM-DD" string.
 */
export function serialToDate(serial: number): Date {
  // Excel epoch is 1899-12-30; add the fractional day offset.
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

export function serialToISO(serial: number): string {
  return serialToDate(serial).toISOString().slice(0, 10);
}

/** Parse a possibly string/number cell into a safe integer (or null). */
export function toInt(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value) : null;
  }
  const s = String(value).trim().replace(/,/g, "").replace(/€/g, "").replace(/\s/g, "");
  if (s === "" || !/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Parse a decimal money cell (keeps cents precision, string-safe for "3.60"). */
export function toMoneyCents(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value * 100) : null;
  }
  const s = String(value).trim().replace(/€/g, "").replace(/\s/g, "");
  if (s === "" || !/\d/.test(s)) return null;
  return parseEURToCents(s);
}

/**
 * Arabic data hygiene (plan §11): trim, collapse internal whitespace, strip
 * stray noise characters. Originals are preserved upstream in aliases/notes —
 * this never destroys the source value.
 */
export function cleanArabic(value: unknown): string {
  const s = String(value ?? "");
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[ *\u00A0]+$/g, "")
    .trim();
}
