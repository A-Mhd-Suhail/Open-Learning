import { describe, expect, it } from "vitest";
import { parseYoutubeId, thumbnailFor } from "@/lib/videos/youtube";
import { mapHeaders, validateRows } from "@/lib/videos/validate";
import { applyFilters, EMPTY_FILTERS, optionsFor } from "@/lib/videos/filter";
import { buildTemplate, parseXlsx, ImportInputError } from "@/lib/videos/xlsx";
import { parseSheetUrl } from "@/lib/videos/sheets";
import type { Video } from "@/lib/videos/types";

describe("youtube", () => {
  it("accepts valid urls", () => {
    expect(parseYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYoutubeId("https://youtu.be/dQw4w9WgXcQ?t=5")).toBe("dQw4w9WgXcQ");
    expect(parseYoutubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("rejects invalid, http, lookalike and javascript urls", () => {
    for (const u of ["http://youtube.com/watch?v=dQw4w9WgXcQ", "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ", "javascript:alert(1)", "https://youtube.com/watch", "not a url", "https://youtube.com/watch?v=short"])
      expect(parseYoutubeId(u), u).toBeNull();
  });
  it("derives thumbnails", () => {
    expect(thumbnailFor("https://youtu.be/dQw4w9WgXcQ")).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(thumbnailFor("https://youtu.be/dQw4w9WgXcQ", "http://x/y.jpg")).toContain("ytimg");
    expect(thumbnailFor("https://youtu.be/dQw4w9WgXcQ", "https://x/y.jpg")).toBe("https://x/y.jpg");
  });
});

const good = { "Video ID": "A1", Exam: "jee", Subject: "Physics", Chapter: "Mechanics", "Video Title": "T", "YouTube Link": "https://youtu.be/dQw4w9WgXcQ", Year: "2025" };

describe("validateRows", () => {
  it("accepts a good row, normalises exam case, marks update vs create", () => {
    const r = validateRows([good, { ...good, "Video ID": "A2" }], new Set(["A2"]));
    expect(r.issues).toEqual([]);
    expect(r.valid.map((v) => [v.video_id, v.exam, v.action])).toEqual([["A1", "JEE", "create"], ["A2", "JEE", "update"]]);
  });
  it("flags missing link, bad exam, duplicates, bad year", () => {
    const r = validateRows([
      { ...good, "YouTube Link": "" }, { ...good, "Video ID": "B", Exam: "CBSE" }, good, { ...good }, { ...good, "Video ID": "C", Year: "20x5" },
    ], new Set());
    const msgs = r.issues.flatMap((i) => i.problems).join("|");
    expect(msgs).toContain("Missing YouTube Link");
    expect(msgs).toContain("Exam must be one of");
    expect(msgs).toContain("Duplicate Video ID");
    expect(msgs).toContain("Year must be");
    expect(r.valid.length).toBe(0); // every "A1" row is rejected: row 2 is invalid and rows 4-5 duplicate it; C has a bad year
  });
  it("reports missing required headers", () => {
    expect(mapHeaders(["Video ID", "Exam"]).errors.length).toBe(4);
    expect(mapHeaders(["video id", " EXAM ", "subject", "chapter", "video title", "youtube link"]).errors).toEqual([]);
  });
});

const mk = (o: Partial<Video>): Video => ({ id: o.video_id ?? "x", video_id: "x", exam: "JEE", class: "12", subject: "Physics", chapter: "Mechanics", topic: "Newton", year: 2025, title: "T", youtube_url: "https://youtu.be/dQw4w9WgXcQ", thumbnail_url: null, description: null, language: "English", created_at: "2025-01-01", ...o });

describe("filters", () => {
  const vids = [mk({ video_id: "1", title: "Laws of motion" }), mk({ video_id: "2", chapter: "Optics", year: 2024, title: "Lenses" }), mk({ video_id: "3", subject: "Chemistry", chapter: "Atoms", year: 2025, language: "Hindi", title: "Atom basics" })];
  it("combines exact filters and search", () => {
    expect(applyFilters(vids, { ...EMPTY_FILTERS, subject: "Physics", year: "2025" }, "title").map((v) => v.video_id)).toEqual(["1"]);
    expect(applyFilters(vids, { ...EMPTY_FILTERS, q: "atom" }, "title").map((v) => v.video_id)).toEqual(["3"]);
    expect(applyFilters(vids, { ...EMPTY_FILTERS, language: "Hindi", subject: "Physics" }, "title")).toEqual([]);
  });
  it("cascades options", () => {
    expect(optionsFor(vids, { ...EMPTY_FILTERS, subject: "Physics" }, "chapter")).toEqual(["Mechanics", "Optics"]);
    expect(optionsFor(vids, { ...EMPTY_FILTERS, subject: "Physics" }, "subject")).toEqual(["Chemistry", "Physics"]);
  });
  it("sorts", () => {
    expect(applyFilters(vids, EMPTY_FILTERS, "year-asc")[0].video_id).toBe("2");
  });
});

describe("sheet url", () => {
  const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abc";
  it("accepts docs.google.com sheet urls", () => expect(parseSheetUrl(`https://docs.google.com/spreadsheets/d/${id}/edit#gid=0`)).toBe(id));
  it("rejects others", () => {
    for (const u of [`http://docs.google.com/spreadsheets/d/${id}`, `https://docs.google.com.evil.com/spreadsheets/d/${id}`, `https://evil.com/?https://docs.google.com/spreadsheets/d/${id}`, "https://docs.google.com/document/d/" + id, "file:///etc/passwd", "http://169.254.169.254/"])
      expect(() => parseSheetUrl(u), u).toThrow(ImportInputError);
  });
});

describe("xlsx", () => {
  it("template round-trips and validates", async () => {
    const buf = await buildTemplate();
    const file = new File([new Uint8Array(buf)], "t.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const { rows, headerErrors } = await parseXlsx(file);
    expect(headerErrors).toEqual([]);
    const r = validateRows(rows, new Set());
    expect(r.issues).toEqual([]);
    expect(r.valid.length).toBe(3);
  });
  it("rejects wrong extension, fake xlsx, empty, oversize", async () => {
    await expect(parseXlsx(new File(["x"], "a.csv"))).rejects.toThrow(ImportInputError);
    await expect(parseXlsx(new File(["not a zip file"], "a.xlsx"))).rejects.toThrow(/real .xlsx/);
    await expect(parseXlsx(new File([], "a.xlsx"))).rejects.toThrow(/empty/);
    await expect(parseXlsx(new File([new Uint8Array(4 * 1024 * 1024 + 1)], "a.xlsx"))).rejects.toThrow(/4 MB/);
  });
});

import { isYoutubeLink } from "@/lib/videos/youtube";
import { deriveFields, examFromTab } from "@/lib/videos/sheets";

describe("shared-sheet format", () => {
  const search = "https://www.youtube.com/results?search_query=Physics+Wallah+Class+9+Atoms";
  it("rejects YouTube search, playlist and channel pages", () => {
    for (const u of [search, "https://www.youtube.com/results", "https://www.youtube.com/playlist?list=PL123", "https://www.youtube.com/@channel", "https://www.youtube.com/channel/UC123", "https://evil.com/results?search_query=x"])
      expect(isYoutubeLink(u), u).toBe(false);
  });
  it("maps title/link_url/channel/board and derives exam, id and description", () => {
    const { map, errors } = mapHeaders(["language", "channel", "board", "class", "subject", "chapter", "title", "year", "link_type", "link_label", "link_url"], { derive: true });
    expect(errors).toEqual([]);
    expect(map.size).toBe(9);
    const r: Record<string, string> = { Language: "English", Channel: "Magnet Brains", Board: "cbse", Class: "9", Subject: "chemistry", Chapter: "Atoms", "Video Title": "Atoms", "YouTube Link": search, Year: "2024-2025" };
    deriveFields(r, examFromTab("School"));
    const again: Record<string, string> = { ...r }; delete again["Video ID"]; deriveFields(again, "School");
    expect(r["Exam"]).toBe("School"); expect(r["Subject"]).toBe("Chemistry"); expect(r["Description"]).toBe("Magnet Brains · CBSE");
    expect(r["Video ID"]).toBe(again["Video ID"]); // stable
    const v = validateRows([r], new Set());
    expect(v.issues).toHaveLength(1);
    expect(v.issues[0].problems.join()).toContain("direct video URL");
    r["YouTube Link"] = "https://youtu.be/dQw4w9WgXcQ"; deriveFields(r, "School");
    expect(r["Video ID"]).toBe("yt-dQw4w9WgXcQ");
    const ok = validateRows([r], new Set());
    expect(ok.issues).toEqual([]); expect(ok.valid[0].year).toBe(2024);
  });
  it("only guesses the exam from an unambiguous tab name", () => {
    expect(examFromTab("School")).toBe("School"); expect(examFromTab("JEE")).toBe("JEE");
    expect(examFromTab("Jee & Neet")).toBeNull();
  });
});

import { watchUrlFor } from "@/lib/videos/youtube";
describe("watchUrlFor", () => {
  it("normalises every supported form to the canonical watch URL", () => {
    const w = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    for (const u of ["https://youtu.be/dQw4w9WgXcQ?t=5", "https://www.youtube.com/shorts/dQw4w9WgXcQ", "https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=x", w])
      expect(watchUrlFor(u)).toBe(w);
  });
  it("returns null for search, playlist, channel and non-YouTube URLs", () => {
    for (const u of ["https://www.youtube.com/results?search_query=a+b", "https://www.youtube.com/playlist?list=PL1", "https://www.youtube.com/@x", "https://evil.com/watch?v=dQw4w9WgXcQ"])
      expect(watchUrlFor(u), u).toBeNull();
  });
  it("normalises watch, youtu.be and embed on import", () => {
    const w = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    for (const u of [w, "https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ"]) {
      const v = validateRows([{ ...good, "YouTube Link": u }], new Set());
      expect(v.valid[0].youtube_url).toBe(w);
    }
  });
});
