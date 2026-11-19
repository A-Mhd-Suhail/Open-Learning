import { describe, expect, it, vi } from "vitest";

// profile.ts is a server module; stub the session/React/navigation parts so only the pure validation runs.
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T,>(f: T) => f }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireSession: vi.fn() }));

import { languageProfileSchema, parseLanguageProfileForm } from "@/lib/language/profile";

function form(entries: [string, string][]) {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return fd;
}
const ok = (fd: FormData) => { const r = parseLanguageProfileForm(fd); if (!r.ok) throw new Error(r.error); return r.value; };

describe("parseLanguageProfileForm", () => {
  it("parses a valid form, trims and dedupes known languages case-insensitively", () => {
    const v = ok(form([["target_language", "  Tamil "], ["known_languages", "English"], ["known_languages", "english"], ["known_languages", " Hindi "], ["proficiency", "intermediate"], ["discoverable", "on"]]));
    expect(v).toEqual({ target_language: "Tamil", known_languages: ["English", "Hindi"], proficiency: "intermediate", discoverable: true });
  });
  it("defaults proficiency to beginner and discoverable to false when absent", () => {
    const v = ok(form([["target_language", "French"]]));
    expect(v.proficiency).toBe("beginner");
    expect(v.discoverable).toBe(false);
    expect(v.known_languages).toEqual([]);
  });
  it("accepts discoverable=true", () => expect(ok(form([["target_language", "French"], ["discoverable", "true"]])).discoverable).toBe(true));
  it("rejects missing, short or markup target languages", () => {
    expect(parseLanguageProfileForm(form([])).ok).toBe(false);
    expect(parseLanguageProfileForm(form([["target_language", "x"]])).ok).toBe(false);
    expect(parseLanguageProfileForm(form([["target_language", "<b>"]])).ok).toBe(false);
  });
  it("rejects an unknown proficiency", () => {
    expect(parseLanguageProfileForm(form([["target_language", "French"], ["proficiency", "expert"]])).ok).toBe(false);
  });
  it("rejects more than 12 known languages but allows 12", () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => ["known_languages", `Lang${i + 10}`] as [string, string]);
    expect(parseLanguageProfileForm(form([["target_language", "French"], ...many(13)])).ok).toBe(false);
    expect(parseLanguageProfileForm(form([["target_language", "French"], ...many(12)])).ok).toBe(true);
  });
  it("rejects a target language that is also listed as known (case-insensitive)", () => {
    const r = parseLanguageProfileForm(form([["target_language", "Tamil"], ["known_languages", "tamil"]]));
    expect(r.ok).toBe(false);
  });
  it("rejects an invalid known language label", () => {
    expect(parseLanguageProfileForm(form([["target_language", "French"], ["known_languages", "a"]])).ok).toBe(false);
  });
});

describe("languageProfileSchema", () => {
  it("rejects non-boolean discoverable", () => {
    expect(languageProfileSchema.safeParse({ target_language: "Tamil", known_languages: [], proficiency: "beginner", discoverable: "yes" }).success).toBe(false);
  });
});
