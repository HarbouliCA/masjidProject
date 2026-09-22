/**
 * Table exports (plan §3.5): CSV with a UTF-8 BOM so Excel reads Arabic; XLSX
 * with the sheet's RTL view set, so الشرط/invoice exports open like the book.
 */
import * as XLSX from "xlsx";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(rows: string[][], filename: string) {
  const csv = rows
    .map((r) =>
      r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  download(blob, filename);
}

export function exportXLSX(rows: string[][], sheetName: string, filename: string) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!views"] = [{ RTL: true }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
