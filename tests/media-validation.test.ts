import { describe, expect, it } from "vitest";
import { extFromMime, isOwnedMediaPath, mediaPath, signedUrlsFor, validateImageBatch, validateImageFile } from "@/lib/language/media";
import { MAX_IMAGE_BYTES } from "@/lib/language/types";

const f = (type: string, size = 1000, name = "a") => ({ type, size, name });

describe("validateImageFile", () => {
  it("accepts the four allowed types", () => {
    for (const t of ["image/jpeg", "image/png", "image/webp", "image/gif"]) expect(validateImageFile(f(t))).toBeNull();
  });
  it("rejects other types", () => {
    for (const t of ["image/svg+xml", "application/pdf", "text/html", ""]) expect(validateImageFile(f(t))).not.toBeNull();
  });
  it("enforces the 5 MB boundary and empty files", () => {
    expect(validateImageFile(f("image/png", MAX_IMAGE_BYTES))).toBeNull();
    expect(validateImageFile(f("image/png", MAX_IMAGE_BYTES + 1))).toMatch(/5 MB/);
    expect(validateImageFile(f("image/png", 0))).toMatch(/empty/);
  });
});

describe("validateImageBatch", () => {
  it("caps at 6 images including existing ones", () => {
    const r = validateImageBatch(Array.from({ length: 4 }, () => f("image/png")), 3);
    expect(r.accepted).toHaveLength(3);
    expect(r.errors.join(" ")).toMatch(/at most 6/);
  });
  it("skips invalid files but keeps valid ones", () => {
    const r = validateImageBatch([f("image/png"), f("application/pdf"), f("image/jpeg", MAX_IMAGE_BYTES + 5), f("image/webp")]);
    expect(r.accepted).toHaveLength(2);
    expect(r.errors).toHaveLength(2);
  });
});

describe("paths", () => {
  it("maps mime to extension", () => {
    expect(extFromMime("image/jpeg")).toBe("jpg");
    expect(extFromMime("image/gif")).toBe("gif");
    expect(extFromMime("image/bmp")).toBeNull();
  });
  it("builds and validates owned paths", () => {
    expect(mediaPath("u1", "abc", "image/png")).toBe("u1/abc.png");
    expect(mediaPath("u1", "abc", "text/plain")).toBeNull();
    expect(isOwnedMediaPath("u1", "u1/abc.png")).toBe(true);
    expect(isOwnedMediaPath("u1", "u2/abc.png")).toBe(false);
    expect(isOwnedMediaPath("u1", "u1/../u2/x.png")).toBe(false);
    expect(isOwnedMediaPath("u1", "u1/a/b.png")).toBe(false);
    expect(isOwnedMediaPath("u1", "u1/")).toBe(false);
  });
});

describe("signedUrlsFor", () => {
  it("dedupes, signs once, and maps path to url", async () => {
    let seen: string[] = [];
    const sb = { storage: { from: () => ({ createSignedUrls: async (p: string[]) => { seen = p; return { data: p.map((x) => ({ path: x, signedUrl: `https://s/${x}` })), error: null }; } }) } };
    const out = await signedUrlsFor(sb as never, ["a", "b", "a", ""]);
    expect(seen).toEqual(["a", "b"]);
    expect(out).toEqual({ a: "https://s/a", b: "https://s/b" });
  });
  it("returns empty on error or no paths", async () => {
    const sb = { storage: { from: () => ({ createSignedUrls: async () => ({ data: null, error: new Error("x") }) }) } };
    expect(await signedUrlsFor(sb as never, ["a"])).toEqual({});
    expect(await signedUrlsFor(sb as never, [])).toEqual({});
  });
});
