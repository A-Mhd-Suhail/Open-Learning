import "server-only";
import ExcelJS from "exceljs";
import { COLUMNS } from "./types";
import { mapHeaders, type RawRow } from "./validate";
import { deriveFields } from "./derive";

export const MAX_FILE_BYTES = 4 * 1024 * 1024; // Vercel rejects request bodies over 4.5 MB
export const MAX_ROWS = 10000;
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export class ImportInputError extends Error {}

export function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "object") {
    if ("text" in v && typeof v.text === "string") return v.text;           // hyperlink
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("result" in v && v.result != null) return String(v.result);          // formula
    if (v instanceof Date) return String(v.getUTCFullYear());
    return "";
  }
  return String(v).trim();
}

/** Strictly validates then parses an uploaded .xlsx. Only the first worksheet is read. */
export async function parseXlsx(file: File): Promise<{ rows: RawRow[]; headerErrors: string[] }> {
  if (!file.name.toLowerCase().endsWith(".xlsx")) throw new ImportInputError("Only .xlsx files are accepted.");
  if (file.type && file.type !== XLSX_MIME && file.type !== "application/octet-stream") throw new ImportInputError("File type is not a valid Excel workbook.");
  if (file.size === 0) throw new ImportInputError("The file is empty.");
  if (file.size > MAX_FILE_BYTES) throw new ImportInputError("File is larger than 4 MB.");
  const buf = Buffer.from(await file.arrayBuffer());
  if (!(buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04)) throw new ImportInputError("File is not a real .xlsx workbook.");
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(buf as unknown as ArrayBuffer); } catch { throw new ImportInputError("Could not read the workbook. Is it corrupted?"); }
  const ws = wb.worksheets[0];
  if (!ws) throw new ImportInputError("The workbook has no worksheets.");
  if (ws.rowCount - 1 > MAX_ROWS) throw new ImportInputError(`Too many rows (max ${MAX_ROWS}).`);
  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => { headers[i - 1] = cellText(c.value); });
  // Legacy template has Video ID + Exam columns; the 11-column library format (language, channel, board, class, …) does not.
  const legacy = mapHeaders(headers);
  const hasIds = [...legacy.map.values()].includes("Video ID") && [...legacy.map.values()].includes("Exam");
  const { map, errors } = hasIds ? legacy : mapHeaders(headers, { derive: true });
  const rows: RawRow[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const rec: RawRow = {};
    let any = false;
    map.forEach((col, i) => { const t = cellText(row.getCell(i + 1).value); rec[col] = t; if (t) any = true; });
    if (any) rows.push(rec); else rows.push({}); // keep blank rows so row numbers stay accurate; filtered below
  }
  const out = trimTrailingBlank(rows);
  if (!hasIds) out.forEach((r) => deriveFields(r, null));
  return { rows: out, headerErrors: errors };
}

function trimTrailingBlank(rows: RawRow[]): RawRow[] {
  let end = rows.length;
  while (end > 0 && Object.keys(rows[end - 1]).length === 0) end--;
  return rows.slice(0, end);
}

export async function buildTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Videos");
  ws.addRow([...COLUMNS]);
  ws.addRows([
    ["JEE-PHY-MECH-001", "JEE", "12", "Physics", "Mechanics", "Newton's Laws", 2025, "Newton's Laws of Motion – Complete Lecture", "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "", "Introduction to Newton's three laws with solved examples.", "English"],
    ["NEET-BIO-CELL-001", "NEET", "11", "Biology", "Cell: The Unit of Life", "Cell Organelles", 2025, "Cell Organelles Explained", "https://youtu.be/9bZkp7q19f0", "", "Structure and function of major cell organelles.", "Hindi"],
    ["SCH-MAT-ALG-001", "School", "9", "Mathematics", "Polynomials", "Factorisation", 2024, "Factorisation of Polynomials", "https://www.youtube.com/watch?v=3JZ_D3ELwOQ", "", "Factor theorem and common factorisation techniques.", "English"],
  ]);
  ws.getRow(1).font = { bold: true };
  ws.columns.forEach((c, i) => { c.width = [20, 10, 8, 14, 24, 22, 8, 44, 48, 30, 50, 12][i]; });
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (let r = 2; r <= 1000; r++) ws.getCell(`B${r}`).dataValidation = { type: "list", allowBlank: false, formulae: ['"JEE,NEET,School"'] };
  const help = wb.addWorksheet("Instructions");
  help.addRows([
    ["Column", "Required", "Notes"],
    ["Video ID", "Yes", "Unique per video. Re-importing the same ID updates that video."],
    ["Exam", "Yes", "JEE, NEET or School"], ["Class", "No", "e.g. 6–12"], ["Subject", "Yes", "Physics / Chemistry / Mathematics / Biology …"],
    ["Chapter", "Yes", ""], ["Topic", "No", ""], ["Year", "No", "4-digit year"], ["Video Title", "Yes", ""],
    ["YouTube Link", "Yes", "Direct video link only: https://www.youtube.com/watch?v=… or https://youtu.be/… (search, playlist and channel links are rejected)"],
    ["Thumbnail URL", "No", "https image URL. Blank = YouTube thumbnail is used."], ["Description", "No", ""], ["Language", "No", ""],
  ]);
  help.getRow(1).font = { bold: true };
  help.columns = [{ width: 18 }, { width: 10 }, { width: 70 }];
  return Buffer.from(await wb.xlsx.writeBuffer());
}
