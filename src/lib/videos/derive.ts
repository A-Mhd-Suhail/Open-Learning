import { parseYoutubeId } from "./youtube";
import type { Exam } from "./types";

type RawRow = Record<string, string>;

/** "School" → School, "JEE" → JEE, "NEET" → NEET; ambiguous names (e.g. "Jee & Neet") give null. */
export function examFromTab(title: string): Exam | null {
  const t = title.toLowerCase();
  const hits = (["school", "jee", "neet"] as const).filter((k) => t.includes(k));
  return hits.length === 1 ? ({ school: "School", jee: "JEE", neet: "NEET" } as const)[hits[0]] : null;
}

/** Exam from the class cell: 'JEE' → JEE, 'NEET' → NEET, anything else → null (caller falls back). */
export function examFromClass(cls: string): Exam | null {
  const c = cls.trim().toLowerCase();
  return c === "jee" ? "JEE" : c === "neet" ? "NEET" : null;
}

const titleCase = (x: string) => x.toLowerCase().replace(/(^|[\s&/-])([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase());

export function normaliseSubject(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  const k = t.toLowerCase();
  if (k === "math" || k === "maths" || k === "mathematics") return "Mathematics";
  return titleCase(t);
}

const ACRONYMS = new Set(["cbse", "icse", "ncert", "ssc", "hsc", "igcse", "ib", "kseeb", "tn", "ap", "ts", "isc", "jee", "neet"]);
/** CBSE-style single words are upper-cased; multi-word boards stay readable ("Tamil Nadu State Board"). */
export function formatBoard(b: string): string {
  const t = b.trim().replace(/\s+/g, " ");
  if (!t) return "";
  if (!t.includes(" ")) return t.toUpperCase();
  if (/[A-Z]/.test(t)) return t; // already deliberately cased
  return t.split(" ").map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))).join(" ");
}

/**
 * Fills Exam, Topic (from "Chapter | Topic"), Description and a stable Video ID for sheets that only list
 * chapter + link. Existing values win. Video ID is "yt-" + the 11-char YouTube id so several videos in one
 * chapter never collide.
 */
export function deriveFields(r: RawRow, tabExam: Exam | null): void {
  if (!r["Exam"]) r["Exam"] = examFromClass(r["Class"] ?? "") ?? tabExam ?? "School";
  if (r["Subject"]) r["Subject"] = normaliseSubject(r["Subject"]);
  if (r["Chapter"] && r["Chapter"].includes(" | ") && !r["Topic"]) {
    const [chapter, ...rest] = r["Chapter"].split(" | ").map((x) => x.trim());
    r["Chapter"] = chapter; r["Topic"] = rest.filter(Boolean).join(" | ");
    if (!r["Topic"]) delete r["Topic"];
  }
  if (r["Board"]) r["Board"] = formatBoard(r["Board"]);
  if (!r["Description"] && (r["Channel"] || r["Board"])) r["Description"] = [r["Channel"], r["Board"]].filter(Boolean).join(" · ");
  if (!r["Video ID"]) {
    const id = parseYoutubeId(r["YouTube Link"] ?? "");
    if (id) r["Video ID"] = `yt-${id}`;
  }
}
