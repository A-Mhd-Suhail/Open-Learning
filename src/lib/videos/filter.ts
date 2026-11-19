import type { Video } from "./types";

export type Filters = {
  q: string; class: string; subject: string; chapter: string; topic: string; year: string; language: string;
};
export const EMPTY_FILTERS: Filters = { q: "", class: "", subject: "", chapter: "", topic: "", year: "", language: "" };
export type SortKey = "newest" | "title" | "year-desc" | "year-asc";
export type FilterField = Exclude<keyof Filters, "q">;
export const FILTER_FIELDS: FilterField[] = ["class", "subject", "chapter", "topic", "year", "language"];

const FIELD: Record<FilterField, (v: Video) => string> = {
  class: (v) => (v.class ?? "").trim(), subject: (v) => v.subject?.trim() ?? "", chapter: (v) => v.chapter?.trim() ?? "",
  topic: (v) => (v.topic ?? "").trim(), year: (v) => (v.year ? String(v.year) : ""), language: (v) => (v.language ?? "").trim(),
};

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const LANGUAGE_ORDER = ["English", "Tamil", "Hindi", "Malayalam", "Telugu", "Kannada"];
const norm = (s: string | null | undefined) => (s ?? "").normalize("NFC").toLowerCase();

/** Haystack for free-text search: title, subject, chapter, topic, description (channel · board), language. */
function haystack(v: Video): string {
  return [v.title, v.subject, v.chapter, v.topic, v.description, v.language].map(norm).join("\n");
}
const haystacks = new WeakMap<Video, string>();
const hay = (v: Video) => { let h = haystacks.get(v); if (h === undefined) { h = haystack(v); haystacks.set(v, h); } return h; };

/** Pure predicate (no sorting): every active exact filter must match and every search word must appear. */
export function matches(v: Video, f: Filters, terms: string[]): boolean {
  for (const k of FILTER_FIELDS) if (f[k] && FIELD[k](v) !== f[k]) return false;
  if (terms.length) { const h = hay(v); for (const t of terms) if (!h.includes(t)) return false; }
  return true;
}
const termsOf = (q: string) => norm(q).split(/\s+/).filter(Boolean);

export function applyFilters(videos: Video[], f: Filters, sort: SortKey): Video[] {
  const terms = termsOf(f.q);
  const out = videos.filter((v) => matches(v, f, terms));
  const tie = (a: Video, b: Video) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const by: Record<SortKey, (a: Video, b: Video) => number> = {
    newest: (a, b) => b.created_at.localeCompare(a.created_at) || tie(a, b),
    title: (a, b) => collator.compare(a.title, b.title) || tie(a, b),
    "year-desc": (a, b) => (b.year ?? 0) - (a.year ?? 0) || collator.compare(a.title, b.title) || tie(a, b),
    "year-asc": (a, b) => (a.year ?? 9999) - (b.year ?? 9999) || collator.compare(a.title, b.title) || tie(a, b),
  };
  return out.sort(by[sort]);
}

function sortOptions(field: FilterField, arr: string[]): string[] {
  if (field === "year") return arr.sort((a, b) => Number(b) - Number(a));
  if (field === "language") {
    const rank = (l: string) => { const i = LANGUAGE_ORDER.indexOf(l); return i < 0 ? LANGUAGE_ORDER.length : i; };
    return arr.sort((a, b) => rank(a) - rank(b) || collator.compare(a, b));
  }
  return arr.sort(collator.compare); // numeric collation: classes 6, 7, … 12 (not 10, 11, 12, 6)
}

/** Option lists cascade: each dropdown only offers values that exist given the OTHER active filters (search ignored). */
export function optionsFor(videos: Video[], f: Filters, field: FilterField): string[] {
  const others: Filters = { ...f, [field]: "", q: "" };
  const set = new Set<string>();
  for (const v of videos) if (matches(v, others, [])) { const val = FIELD[field](v); if (val) set.add(val); }
  return sortOptions(field, [...set]);
}

/** All option lists at once. */
export function allOptions(videos: Video[], f: Filters): Record<FilterField, string[]> {
  return Object.fromEntries(FILTER_FIELDS.map((k) => [k, optionsFor(videos, f, k)])) as Record<FilterField, string[]>;
}

/** Clears any filter (other than `keep`) whose value no longer exists given the rest, repeating until consistent. */
export function reconcileFilters(videos: Video[], f: Filters, keep?: FilterField): Filters {
  let cur = f;
  for (let guard = 0; guard < FILTER_FIELDS.length + 1; guard++) {
    let changed = false;
    for (const k of FILTER_FIELDS) {
      if (k === keep || !cur[k]) continue;
      if (!optionsFor(videos, cur, k).includes(cur[k])) { cur = { ...cur, [k]: "" }; changed = true; }
    }
    if (!changed) break;
  }
  return cur;
}

/** Applies a user change and resets dependent filters that became impossible. */
export function changeFilter(videos: Video[], f: Filters, patch: Partial<Filters>): Filters {
  const next = { ...f, ...patch };
  const changed = (Object.keys(patch) as (keyof Filters)[]).find((k) => k !== "q" && patch[k]);
  return reconcileFilters(videos, next, changed as FilterField | undefined);
}

export function hasActiveFilters(f: Filters): boolean {
  return Object.values(f).some((x) => x.trim() !== "");
}
