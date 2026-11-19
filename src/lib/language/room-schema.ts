import { z } from "zod";
import { isLanguageLabel } from "./languages";

/** Validation for creating a language room. Mirrors the checks in rpc create_language_room. */
export const roomSchema = z.object({
  kind: z.enum(["chat", "voice"]),
  name: z.string().trim().min(3, "Room name must be 3–60 characters.").max(60, "Room name must be 3–60 characters."),
  language: z.string().trim().refine(isLanguageLabel, "Choose a language (2–40 characters)."),
  description: z.string().trim().max(300, "Description must be at most 300 characters."),
  visibility: z.enum(["public", "private"]),
  max: z.number().int("Participant limit must be a whole number.").min(2, "Participant limit must be between 2 and 50.").max(50, "Participant limit must be between 2 and 50.").nullable(),
});
export type RoomInput = z.infer<typeof roomSchema>;

/** Parses raw form values. A participant limit is only honoured for voice rooms; for chat it is rejected if sent. */
export function parseRoomForm(raw: { kind: string; name: string; language: string; description: string; visibility: string; max: string }):
  { ok: true; value: RoomInput } | { ok: false; error: string } {
  const maxTxt = raw.max.trim();
  let max: number | null = null;
  if (maxTxt !== "") {
    if (raw.kind !== "voice") return { ok: false, error: "Only voice rooms have a participant limit." };
    max = /^\d+$/.test(maxTxt) ? Number(maxTxt) : Number.NaN;
  }
  const r = roomSchema.safeParse({ ...raw, max: Number.isNaN(max) ? 0.5 : max });
  if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? "Check the form and try again." };
  return { ok: true, value: r.data };
}

export function roomErrorMessage(m: string): string {
  if (/limit reached/i.test(m)) return "You have reached the limit of rooms you can create.";
  if (/3-60/.test(m)) return "Room name must be 3–60 characters.";
  if (/choose a language/i.test(m)) return "Choose a language.";
  if (/participant limit/i.test(m)) return "Participant limit must be between 2 and 50.";
  if (/not authenticated/i.test(m)) return "Please sign in again.";
  return "Could not create the room. Please try again.";
}
