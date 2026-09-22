import { ARABIC_MONTHS } from "./dates";

export interface GridMonth {
  key: string;
  label: string;
}

/** Masjid fiscal year (Jan–Dec 2026) — الشرط grid columns. */
export const MASJID_GRID_MONTHS: GridMonth[] = Array.from({ length: 12 }, (_, i) => ({
  key: `2026-${String(i + 1).padStart(2, "0")}`,
  label: ARABIC_MONTHS[i],
}));

/** School academic year (Oct 2025 – Jun 2026) — invoice grid columns. */
export const SCHOOL_GRID_MONTHS: GridMonth[] = [
  { key: "2025-10", label: ARABIC_MONTHS[9] },
  { key: "2025-11", label: ARABIC_MONTHS[10] },
  { key: "2025-12", label: ARABIC_MONTHS[11] },
  { key: "2026-01", label: ARABIC_MONTHS[0] },
  { key: "2026-02", label: ARABIC_MONTHS[1] },
  { key: "2026-03", label: ARABIC_MONTHS[2] },
  { key: "2026-04", label: ARABIC_MONTHS[3] },
  { key: "2026-05", label: ARABIC_MONTHS[4] },
  { key: "2026-06", label: ARABIC_MONTHS[5] },
];
