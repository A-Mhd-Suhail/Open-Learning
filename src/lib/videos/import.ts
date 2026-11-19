import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ImportInputError, parseXlsx } from "./xlsx";
import { fetchSheetRows, parseSheetUrl } from "./sheets";
import { validateRows, type ValidationResult } from "./validate";

export type ImportSource = { kind: "xlsx"; ref: string; rows: Record<string, string>[]; headerErrors: string[] } | { kind: "google_sheet"; ref: string; rows: Record<string, string>[]; headerErrors: string[] };

export async function loadSource(form: FormData): Promise<ImportSource> {
  const file = form.get("file");
  const url = form.get("sheetUrl");
  if (file instanceof File && file.size > 0) {
    const { rows, headerErrors } = await parseXlsx(file);
    return { kind: "xlsx", ref: file.name.slice(0, 200), rows, headerErrors };
  }
  if (typeof url === "string" && url.trim()) {
    const id = parseSheetUrl(url);
    const { rows, headerErrors } = await fetchSheetRows(id);
    return { kind: "google_sheet", ref: id, rows, headerErrors };
  }
  throw new ImportInputError("Choose an .xlsx file or paste a Google Sheets link.");
}

export async function existingVideoIds(supabase: SupabaseClient, ids: string[]): Promise<Set<string>> {
  const found = new Set<string>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await supabase.from("videos").select("video_id").in("video_id", ids.slice(i, i + 200));
    if (error) throw new Error("Could not check existing videos");
    data.forEach((r) => found.add(r.video_id));
  }
  return found;
}

export async function analyse(supabase: SupabaseClient, src: ImportSource): Promise<ValidationResult> {
  if (src.headerErrors.length) return { valid: [], issues: [], totalRows: src.rows.length, headerErrors: src.headerErrors };
  const ids = src.rows.map((r) => (r["Video ID"] ?? "").trim()).filter(Boolean);
  return validateRows(src.rows, await existingVideoIds(supabase, ids));
}

/** Same-origin check for cookie-authenticated mutating route handlers (CSRF defence in depth). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === req.headers.get("host"); } catch { return false; }
}
