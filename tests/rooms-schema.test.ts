import { describe, expect, it } from "vitest";
import { parseRoomForm, roomErrorMessage } from "@/lib/language/room-schema";

const base = { kind: "chat", name: "Tamil Tuesdays", language: "Tamil", description: "", visibility: "public", max: "" };

describe("parseRoomForm", () => {
  it("accepts a valid chat room and trims", () => {
    const r = parseRoomForm({ ...base, name: "  Tamil Tuesdays  " });
    expect(r).toEqual({ ok: true, value: { kind: "chat", name: "Tamil Tuesdays", language: "Tamil", description: "", visibility: "public", max: null } });
  });
  it("rejects short and long names", () => {
    expect(parseRoomForm({ ...base, name: "ab" }).ok).toBe(false);
    expect(parseRoomForm({ ...base, name: "x".repeat(61) }).ok).toBe(false);
    expect(parseRoomForm({ ...base, name: "x".repeat(60) }).ok).toBe(true);
  });
  it("validates language label", () => {
    expect(parseRoomForm({ ...base, language: "" }).ok).toBe(false);
    expect(parseRoomForm({ ...base, language: "<b>" }).ok).toBe(false);
    expect(parseRoomForm({ ...base, language: "Esperanto" }).ok).toBe(true);
  });
  it("caps description at 300", () => {
    expect(parseRoomForm({ ...base, description: "d".repeat(300) }).ok).toBe(true);
    expect(parseRoomForm({ ...base, description: "d".repeat(301) }).ok).toBe(false);
  });
  it("rejects bad visibility and kind", () => {
    expect(parseRoomForm({ ...base, visibility: "secret" }).ok).toBe(false);
    expect(parseRoomForm({ ...base, kind: "discussion" }).ok).toBe(false);
  });
  it("participant limit only for voice, 2-50", () => {
    expect(parseRoomForm({ ...base, max: "5" }).ok).toBe(false);
    const v = { ...base, kind: "voice" };
    expect(parseRoomForm({ ...v, max: "" })).toMatchObject({ ok: true, value: { max: null } });
    expect(parseRoomForm({ ...v, max: "2" })).toMatchObject({ ok: true, value: { max: 2 } });
    expect(parseRoomForm({ ...v, max: "50" })).toMatchObject({ ok: true, value: { max: 50 } });
    for (const bad of ["1", "51", "0", "-3", "2.5", "abc"]) expect(parseRoomForm({ ...v, max: bad }).ok).toBe(false);
  });
});

describe("roomErrorMessage", () => {
  it("maps known db errors", () => {
    expect(roomErrorMessage("group limit reached")).toMatch(/limit/);
    expect(roomErrorMessage("boom")).toMatch(/try again/);
  });
});
