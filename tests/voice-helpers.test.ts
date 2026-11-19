import { describe, expect, it } from "vitest";
import { capacityLabel, initialsOf, mapVoiceJoinError } from "@/lib/voice/helpers";

describe("mapVoiceJoinError", () => {
  it("returns null without an error", () => expect(mapVoiceJoinError(null)).toBeNull());
  it("maps capacity (SQLSTATE 53400) to 409", () => {
    expect(mapVoiceJoinError({ code: "53400", message: "x" })).toMatchObject({ status: 409, code: "full" });
    expect(mapVoiceJoinError({ message: "room is full" })).toMatchObject({ status: 409 });
  });
  it("maps non-members to 403 and missing rooms to 404", () => {
    expect(mapVoiceJoinError({ code: "42501", message: "not a member" })?.status).toBe(403);
    expect(mapVoiceJoinError({ message: "voice room not found" })?.status).toBe(404);
  });
  it("hides unknown database errors", () => {
    const r = mapVoiceJoinError({ code: "XX000", message: "relation secret_table exploded" });
    expect(r?.status).toBe(500);
    expect(r?.message).not.toMatch(/secret_table/);
  });
});

describe("initialsOf / capacityLabel", () => {
  it("builds initials", () => {
    expect(initialsOf("ada lovelace")).toBe("AL");
    expect(initialsOf("  Plato ")).toBe("P");
    expect(initialsOf("")).toBe("?");
    expect(initialsOf(null)).toBe("?");
  });
  it("labels capacity", () => {
    expect(capacityLabel(3, 8)).toBe("3 of 8 live");
    expect(capacityLabel(2, null)).toBe("2 live");
  });
});
