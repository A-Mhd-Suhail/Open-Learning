import { COLUMNS, EXAMS, type Exam } from "./types";
import { watchUrlFor } from "./youtube";

export type RawRow = Record<string, string>;
export type CleanVideo = {
  video_id: string; exam: Exam; class: string | null; subject: string; chapter: string; topic: string | null;
  year: number | null; title: string; youtube_url: string; thumbnail_url: string | null; description: string | null; language: string | null;
};
export type RowIssue = { row: number; video_id: string; problems: string[] };
export type ValidationResult = {
  valid: (CleanVideo & { row: number; action: "create" | "update" })[];
  issues: RowIssue[];
  totalRows: number;
  headerErrors: string[];
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
export type Col = (typeof COLUMNS)[number] | "Channel" | "Board";
const HEADER_KEYS = new Map<string, Col>([
  ...COLUMNS.map((c) => [norm(c), c] as [string, Col]),
  // Aliases used by the shared "video library" sheet format.
  ["title", "Video Title"], ["linkurl", "YouTube Link"], ["channel", "Channel"], ["board", "Board"],
]);
const MAX = { id: 64, short: 120, title: 200, desc: 1000, url: 500 };

/** Maps arbitrary header spellings to canonical column names; reports missing required columns. */
export function mapHeaders(headers: string[], opts: { derive?: boolean } = {}): { map: Map<number, Col>; errors: string[] } {
  const map = new Map<number, Col>();
  headers.forEach((h, i) => { const c = HEADER_KEYS.get(norm(h ?? "")); if (c && ![...map.values()].includes(c)) map.set(i, c); });
  const present = new Set(map.values());
  // With `derive` (Google Sheets), Video ID and Exam are generated from the row and tab name.
  const required = (opts.derive ? ["Subject", "Chapter", "Video Title", "YouTube Link"] : ["Video ID", "Exam", "Subject", "Chapter", "Video Title", "YouTube Link"]) as Col[];
  return { map, errors: required.filter((r) => !present.has(r)).map((r) => `Missing required column "${r}"`) };
}

export function validateRows(rows: RawRow[], existingIds: Set<string>): ValidationResult {
  const valid: ValidationResult["valid"] = [];
  const issues: RowIssue[] = [];
  const seen = new Map<string, number>();
  rows.forEach((r, idx) => {
    const row = idx + 2; // spreadsheet row number (header is row 1)
    const problems: string[] = [];
    const get = (k: Col) => (r[k] ?? "").toString().trim();
    const video_id = get("Video ID");
    if (!video_id) problems.push("Missing Video ID");
    else if (video_id.length > MAX.id || !/^[A-Za-z0-9._-]+$/.test(video_id)) problems.push("Video ID may only contain letters, numbers, . _ - (max 64)");
    if (video_id) {
      const first = seen.get(video_id);
      if (first) problems.push(`Duplicate Video ID (also on row ${first})`); else seen.set(video_id, row);
    }
    const examRaw = get("Exam");
    const exam = EXAMS.find((e) => e.toLowerCase() === examRaw.toLowerCase());
    if (!exam) problems.push(`Exam must be one of ${EXAMS.join(" / ")}`);
    const subject = get("Subject"); if (!subject) problems.push("Missing Subject");
    const chapter = get("Chapter"); if (!chapter) problems.push("Missing Chapter");
    const title = get("Video Title"); if (!title) problems.push("Missing Video Title");
    const link = get("YouTube Link");
    if (!link) problems.push("Missing YouTube Link");
    else if (link.length > MAX.url || !watchUrlFor(link)) problems.push("YouTube link must be a direct video URL (watch?v=… / youtu.be/… / embed/…)");
    const yearRaw = get("Year");
    let year: number | null = null;
    if (yearRaw) { const y = Number(/^(\d{4})\s*[-–/]\s*\d{2,4}$/.exec(yearRaw)?.[1] ?? yearRaw); if (!Number.isInteger(y) || y < 1990 || y > 2100) problems.push("Year must be a 4-digit year"); else year = y; }
    const thumb = get("Thumbnail URL");
    if (thumb && !/^https:\/\/\S+$/i.test(thumb)) problems.push("Thumbnail URL must be an https URL");
    if (title.length > MAX.title) problems.push("Title too long (max 200)");
    for (const [k, n] of [["Class", MAX.short], ["Subject", MAX.short], ["Chapter", MAX.short], ["Topic", MAX.short], ["Language", 40]] as const)
      if (get(k).length > n) problems.push(`${k} too long (max ${n})`);
    if (get("Description").length > MAX.desc) problems.push("Description too long (max 1000)");

    if (problems.length || !exam) { issues.push({ row, video_id, problems }); return; }
    valid.push({
      row, action: existingIds.has(video_id) ? "update" : "create", video_id, exam, class: get("Class") || null, subject, chapter,
      topic: get("Topic") || null, year, title, youtube_url: watchUrlFor(link) ?? link, thumbnail_url: thumb || null,
      description: get("Description") || null, language: get("Language") || null,
    });
  });
  return { valid, issues, totalRows: rows.length, headerErrors: [] };
}

/** Drops spreadsheet-only metadata so the object can be written to the videos table. */
export function toDbRow(v: ValidationResult["valid"][number]): CleanVideo {
  const { row, action, ...rest } = v;
  void row; void action;
  return rest;
}
