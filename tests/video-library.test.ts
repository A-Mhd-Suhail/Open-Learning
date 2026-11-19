import { describe, expect, it } from "vitest";
import { allOptions, applyFilters, changeFilter, EMPTY_FILTERS, hasActiveFilters, optionsFor, reconcileFilters, type Filters } from "@/lib/videos/filter";
import { loadAllVideos, PAGE_SIZE } from "@/lib/videos/load";
import { mapHeaders, validateRows } from "@/lib/videos/validate";
import { deriveFields, formatBoard, normaliseSubject } from "@/lib/videos/derive";
import { buildTemplate, parseXlsx } from "@/lib/videos/xlsx";
import type { Video } from "@/lib/videos/types";
import ExcelJS from "exceljs";

let n = 0;
const mk = (o: Partial<Video>): Video => {
  n++;
  return { id: `id-${String(n).padStart(5, "0")}`, video_id: `v${n}`, exam: "School", class: "9", subject: "Physics", chapter: "Motion", topic: null, year: 2025,
    title: `Title ${n}`, youtube_url: "https://youtu.be/dQw4w9WgXcQ", thumbnail_url: null, description: "Magnet Brains · CBSE", language: "English", created_at: "2025-01-01T00:00:00Z", ...o };
};
const F = (o: Partial<Filters>): Filters => ({ ...EMPTY_FILTERS, ...o });
const ids = (v: Video[]) => v.map((x) => x.video_id);

const LANGS = ["Kannada", "Telugu", "Malayalam", "Hindi", "Tamil", "English"];
const lib: Video[] = [
  ...[12, 6, 10, 7, 11, 8, 9].map((c) => mk({ class: String(c), video_id: `c${c}` })),
  ...LANGS.map((l) => mk({ language: l, video_id: `l-${l}`, class: "9", title: `Lesson ${l}` })),
  mk({ video_id: "chem-atoms", subject: "Chemistry", chapter: "Atoms", topic: "Bohr model", year: 2024, class: "11", description: "Physics Wallah · ICSE" }),
  mk({ video_id: "chem-atoms2", subject: "Chemistry", chapter: "Atoms", topic: "Isotopes", year: 2023, class: "11", language: "Tamil" }),
  mk({ video_id: "bio-cells", subject: "Biology", chapter: "Cells", topic: "Nucleus", year: 2024, class: "8", language: "தமிழ்", title: "செல் அமைப்பு" }),
];

describe("filter options", () => {
  it("sorts classes numerically 6..12", () => {
    expect(optionsFor(lib, EMPTY_FILTERS, "class")).toEqual(["6", "7", "8", "9", "10", "11", "12"]);
  });
  it("offers all six languages in a fixed order (plus unknown scripts last)", () => {
    expect(optionsFor(lib, EMPTY_FILTERS, "language")).toEqual(["English", "Tamil", "Hindi", "Malayalam", "Telugu", "Kannada", "தமிழ்"]);
  });
  it("sorts years newest first", () => expect(optionsFor(lib, EMPTY_FILTERS, "year")).toEqual(["2025", "2024", "2023"]));
  it("cascades: chapter/topic options depend on subject, subject on others", () => {
    expect(optionsFor(lib, F({ subject: "Chemistry" }), "chapter")).toEqual(["Atoms"]);
    expect(optionsFor(lib, F({ subject: "Chemistry", chapter: "Atoms" }), "topic")).toEqual(["Bohr model", "Isotopes"]);
    expect(optionsFor(lib, F({ language: "Tamil" }), "subject")).toEqual(["Chemistry", "Physics"]);
    expect(optionsFor(lib, F({ topic: "Nucleus" }), "subject")).toEqual(["Biology"]);
    expect(optionsFor(lib, F({ year: "2023" }), "class")).toEqual(["11"]);
  });
  it("a field's own selection does not narrow its own list; search is ignored", () => {
    expect(optionsFor(lib, F({ subject: "Chemistry", q: "zzz" }), "subject")).toContain("Physics");
  });
  it("hides nothing: single-class exam yields one option (UI hides it)", () => {
    const jee = [mk({ exam: "JEE", class: "JEE" }), mk({ exam: "JEE", class: "JEE", subject: "Chemistry" })];
    expect(optionsFor(jee, EMPTY_FILTERS, "class")).toEqual(["JEE"]);
    expect(optionsFor(jee, EMPTY_FILTERS, "subject")).toEqual(["Chemistry", "Physics"]);
    expect(allOptions(jee, EMPTY_FILTERS).language).toEqual(["English"]);
  });
});

describe("applyFilters", () => {
  it("filters by topic, year and language together", () => {
    expect(ids(applyFilters(lib, F({ topic: "Isotopes", year: "2023", language: "Tamil" }), "title"))).toEqual(["chem-atoms2"]);
    expect(applyFilters(lib, F({ topic: "Isotopes", language: "Hindi" }), "title")).toEqual([]);
  });
  it("filters each of the six languages", () => {
    for (const l of LANGS) expect(applyFilters(lib, F({ language: l }), "title").every((v) => v.language === l)).toBe(true);
    expect(applyFilters(lib, F({ language: "Malayalam" }), "title").map((v) => v.video_id)).toEqual(["l-Malayalam"]);
  });
  it("search matches title, subject, chapter, topic, channel/board in description, multiple words, any case, non-Latin", () => {
    expect(ids(applyFilters(lib, F({ q: "BOHR" }), "title"))).toEqual(["chem-atoms"]);
    expect(ids(applyFilters(lib, F({ q: "physics wallah" }), "title"))).toEqual(["chem-atoms"]);
    expect(ids(applyFilters(lib, F({ q: "icse" }), "title"))).toEqual(["chem-atoms"]);
    expect(ids(applyFilters(lib, F({ q: "atoms isotopes" }), "title"))).toEqual(["chem-atoms2"]);
    expect(ids(applyFilters(lib, F({ q: "அமைப்பு" }), "title"))).toEqual(["bio-cells"]);
    expect(ids(applyFilters(lib, F({ q: "  cells  " }), "title"))).toEqual(["bio-cells"]);
    expect(applyFilters(lib, F({ q: "nonexistent" }), "title")).toEqual([]);
  });
  it("search combines with filters", () => {
    expect(ids(applyFilters(lib, F({ q: "atoms", year: "2024" }), "title"))).toEqual(["chem-atoms"]);
  });
  it("sorts stably", () => {
    const a = mk({ title: "A", created_at: "2025-02-01T00:00:00Z", year: 2020 });
    const b = mk({ title: "B", created_at: "2025-02-01T00:00:00Z", year: 2020 });
    const c = mk({ title: "C", created_at: "2025-03-01T00:00:00Z", year: null });
    expect(ids(applyFilters([b, c, a], EMPTY_FILTERS, "newest"))).toEqual([c.video_id, a.video_id, b.video_id]);
    expect(ids(applyFilters([c, b, a], EMPTY_FILTERS, "title"))).toEqual([a.video_id, b.video_id, c.video_id]);
    expect(ids(applyFilters([a, c], EMPTY_FILTERS, "year-asc"))).toEqual([a.video_id, c.video_id]);
    expect(ids(applyFilters([a, c], EMPTY_FILTERS, "year-desc"))).toEqual([a.video_id, c.video_id]);
  });
});

describe("cascade reset behaviour", () => {
  it("changing subject resets a chapter/topic that no longer exists", () => {
    const f = F({ subject: "Chemistry", chapter: "Atoms", topic: "Bohr model" });
    const next = changeFilter(lib, f, { subject: "Physics" });
    expect(next).toMatchObject({ subject: "Physics", chapter: "", topic: "" });
  });
  it("keeps dependent filters that are still valid", () => {
    const f = F({ subject: "Chemistry", chapter: "Atoms", year: "2024" });
    expect(changeFilter(lib, f, { language: "English" })).toMatchObject({ chapter: "Atoms", year: "2024", language: "English" });
  });
  it("clearing a filter keeps the rest", () => {
    expect(changeFilter(lib, F({ subject: "Chemistry", chapter: "Atoms" }), { subject: "" })).toMatchObject({ subject: "", chapter: "Atoms" });
  });
  it("picking a topic that conflicts with the current subject resets the subject", () => {
    expect(changeFilter(lib, F({ subject: "Physics" }), { topic: "Nucleus" })).toMatchObject({ topic: "Nucleus", subject: "" });
  });
  it("never leaves an impossible selection and keeps results non-empty after any single change", () => {
    const vals = { class: ["6", "11", "12"], subject: ["Physics", "Chemistry", "Biology"], chapter: ["Atoms", "Cells", "Motion"], topic: ["Bohr model", "Nucleus"], year: ["2023", "2024", "2025"], language: LANGS };
    let f = EMPTY_FILTERS;
    for (const k of Object.keys(vals) as (keyof typeof vals)[]) for (const val of vals[k]) {
      if (!optionsFor(lib, f, k).includes(val)) continue; // the UI only offers valid options
      f = changeFilter(lib, f, { [k]: val });
      for (const key of Object.keys(vals) as (keyof typeof vals)[]) if (f[key]) expect(optionsFor(lib, f, key)).toContain(f[key]);
      expect(applyFilters(lib, f, "title").length).toBeGreaterThan(0);
    }
  });
  it("reconcileFilters repairs a stale state and is idempotent", () => {
    const stale = F({ subject: "Physics", chapter: "Atoms", topic: "Bohr model" });
    const fixed = reconcileFilters(lib, stale);
    expect(reconcileFilters(lib, fixed)).toEqual(fixed);
    for (const k of ["subject", "chapter", "topic"] as const) if (fixed[k]) expect(optionsFor(lib, fixed, k)).toContain(fixed[k]);
  });
  it("hasActiveFilters", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters(F({ q: "x" }))).toBe(true);
    expect(hasActiveFilters(F({ year: "2024" }))).toBe(true);
  });
});

describe("loadAllVideos paging", () => {
  function fake(total: number) {
    const all = Array.from({ length: total }, (_, i) => ({ id: `r${i}` }));
    const calls: [number, number][] = [];
    const supabase = { from: () => {
      let range: [number, number] = [0, 0]; let count = false;
      const b = {
        select: (_c: string, o?: { count?: string }) => { count = !!o?.count; return b; }, eq: () => b, order: () => b,
        range: (a: number, z: number) => { range = [a, z]; calls.push(range); return b; },
        then: (res: (v: unknown) => unknown) => res({ data: all.slice(range[0], range[1] + 1), error: null, count: count ? total : null }),
      };
      return b;
    } };
    return { supabase: supabase as never, calls };
  }
  it("loads more than 1000 rows across pages without gaps or duplicates", async () => {
    const { supabase, calls } = fake(6234);
    const { videos, error } = await loadAllVideos(supabase, "School");
    expect(error).toBeNull();
    expect(videos).toHaveLength(6234);
    expect(new Set(videos.map((v) => v.id)).size).toBe(6234);
    expect(calls.length).toBe(Math.ceil(6234 / PAGE_SIZE));
  });
  it("handles small and exact-multiple sizes", async () => {
    expect((await loadAllVideos(fake(5).supabase, "JEE")).videos).toHaveLength(5);
    expect((await loadAllVideos(fake(2000).supabase, "JEE")).videos).toHaveLength(2000);
    expect((await loadAllVideos(fake(1000).supabase, "JEE")).videos).toHaveLength(1000);
  });
});

const H = ["language", "channel", "board", "class", "subject", "chapter", "title", "year", "link_type", "link_label", "link_url"];
const row = (o: Record<string, string>) => {
  const { map } = mapHeaders(H, { derive: true });
  const base: Record<string, string> = { language: "Tamil", channel: "Magnet Brains", board: "cbse", class: "9", subject: "maths", chapter: "Polynomials", title: "Polynomials intro", year: "2025-2026", link_type: "video", link_label: "Watch", link_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", ...o };
  const names: Record<string, string> = { language: "Language", channel: "Channel", board: "Board", class: "Class", subject: "Subject", chapter: "Chapter", title: "Video Title", year: "Year", link_url: "YouTube Link" };
  const r: Record<string, string> = {};
  for (const col of map.values()) { const k = Object.keys(names).find((x) => names[x] === col)!; r[col] = base[k]; }
  return r;
};
const derive = (o: Record<string, string> = {}, tab: "School" | null = null) => { const r = row(o); deriveFields(r, tab); return r; };

describe("11-column library format", () => {
  it("maps all headers without Video ID/Exam", () => {
    const { map, errors } = mapHeaders(H, { derive: true });
    expect(errors).toEqual([]);
    expect(map.size).toBe(9);
  });
  it("validates a school row; subject, year, description, id derived", () => {
    const v = validateRows([derive()], new Set());
    expect(v.issues).toEqual([]);
    expect(v.valid[0]).toMatchObject({ exam: "School", subject: "Mathematics", year: 2025, class: "9", language: "Tamil", video_id: "yt-dQw4w9WgXcQ", description: "Magnet Brains · CBSE", topic: null });
  });
  it("derives JEE and NEET from class", () => {
    expect(validateRows([derive({ class: "JEE", subject: "physics" })], new Set()).valid[0]).toMatchObject({ exam: "JEE", class: "JEE", subject: "Physics" });
    expect(validateRows([derive({ class: "NEET", subject: "biology" })], new Set()).valid[0].exam).toBe("NEET");
    expect(validateRows([derive({ class: "12" })], new Set()).valid[0].exam).toBe("School");
  });
  it("splits 'Chapter | Topic'", () => {
    const v = validateRows([derive({ chapter: "Atoms | Bohr model" })], new Set()).valid[0];
    expect(v.chapter).toBe("Atoms"); expect(v.topic).toBe("Bohr model");
  });
  it("gives two videos in one chapter different Video IDs", () => {
    const rows = [derive(), derive({ link_url: "https://youtu.be/9bZkp7q19f0", title: "Second" })];
    const v = validateRows(rows, new Set());
    expect(v.issues).toEqual([]);
    expect(new Set(v.valid.map((x) => x.video_id)).size).toBe(2);
  });
  it("rejects search URLs", () => {
    const v = validateRows([derive({ link_url: "https://www.youtube.com/results?search_query=a+b" })], new Set());
    expect(v.issues[0].problems.join()).toContain("direct video URL");
  });
  it("normalises subjects and boards", () => {
    expect(["math", "Maths", "MATHEMATICS"].map(normaliseSubject)).toEqual(["Mathematics", "Mathematics", "Mathematics"]);
    expect(normaliseSubject("social science")).toBe("Social Science");
    expect(normaliseSubject("physics")).toBe("Physics");
    expect(formatBoard("cbse")).toBe("CBSE");
    expect(formatBoard("tamil nadu state board")).toBe("Tamil Nadu State Board");
    expect(formatBoard("Tamil Nadu State Board")).toBe("Tamil Nadu State Board");
  });
  it("accepts the 11-column workbook through the xlsx parser and still accepts the legacy template", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Videos");
    ws.addRow(H);
    ws.addRow(["English", "PW", "cbse", "JEE", "physics", "Kinematics | Projectile motion", "Projectile", "2025-2026", "video", "Watch", "https://youtu.be/dQw4w9WgXcQ"]);
    ws.addRow(["Hindi", "PW", "cbse", "7", "social science", "Civics", "Civics 1", "2024", "video", "Watch", "https://youtu.be/9bZkp7q19f0"]);
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    const { rows, headerErrors } = await parseXlsx(new File([new Uint8Array(buf)], "Open-Learning-Videos.xlsx"));
    expect(headerErrors).toEqual([]);
    const v = validateRows(rows, new Set());
    expect(v.issues).toEqual([]);
    expect(v.valid.map((x) => [x.exam, x.subject, x.chapter, x.topic, x.video_id, x.year])).toEqual([
      ["JEE", "Physics", "Kinematics", "Projectile motion", "yt-dQw4w9WgXcQ", 2025],
      ["School", "Social Science", "Civics", null, "yt-9bZkp7q19f0", 2024],
    ]);
    const legacy = await parseXlsx(new File([new Uint8Array(await buildTemplate())], "t.xlsx"));
    expect(validateRows(legacy.rows, new Set()).valid.map((x) => x.video_id)).toContain("JEE-PHY-MECH-001");
  });
});
