/** Pure helpers for voice rooms (no server/client-only imports so they can be unit-tested). */

export const HEARTBEAT_MS = 30_000;

export type VoiceJoinFailure = { status: 403 | 404 | 409 | 500; code: "full" | "forbidden" | "not_found" | "error"; message: string };

type PgLikeError = { code?: string | null; message?: string | null } | null | undefined;

/** Maps an error from rpc("voice_join") to an HTTP status + a friendly, non-leaky message. */
export function mapVoiceJoinError(error: PgLikeError): VoiceJoinFailure | null {
  if (!error) return null;
  const msg = (error.message ?? "").toLowerCase();
  if (error.code === "53400" || msg.includes("room is full"))
    return { status: 409, code: "full", message: "This room is full right now. Try again in a moment." };
  if (error.code === "42501" || msg.includes("not a member"))
    return { status: 403, code: "forbidden", message: "Join this room before connecting." };
  if (msg.includes("voice room not found"))
    return { status: 404, code: "not_found", message: "Voice room not found." };
  return { status: 500, code: "error", message: "Could not join the voice room. Please try again." };
}

export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = [...parts[0]][0] ?? "?";
  const last = parts.length > 1 ? ([...parts[parts.length - 1]][0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** "3 of 8 live" or "3 live" when uncapped. */
export function capacityLabel(live: number, max: number | null | undefined): string {
  return max ? `${live} of ${max} live` : `${live} live`;
}
