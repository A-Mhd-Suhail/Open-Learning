import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { livekitConfigured } from "@/lib/config";
import { serverEnv } from "@/lib/env";
import { sameOrigin } from "@/lib/videos/import";
import { mapVoiceJoinError } from "@/lib/voice/helpers";

const Body = z.union([z.object({ groupId: z.string().uuid() }), z.object({ callId: z.string().uuid() })]);

/**
 * Mints a LiveKit token ONLY after the database confirms the caller may enter that room:
 *  - group voice room: caller must be a member of a voice group and voice_join (capacity-aware) must succeed; 409 when full
 *  - friend call: caller must be caller or callee of a live call
 * The token is scoped to exactly one room and expires in 1 hour.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  if (!livekitConfigured()) return NextResponse.json({ error: "Voice is not configured on this server yet." }, { status: 503 });
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  let room: string;
  if ("groupId" in parsed.data) {
    const { data: g } = await s.supabase.from("groups").select("id, type").eq("id", parsed.data.groupId).maybeSingle();
    if (!g || g.type !== "voice") return NextResponse.json({ error: "Voice room not found" }, { status: 404 });
    const { data: m } = await s.supabase.from("group_members").select("user_id").eq("group_id", g.id).eq("user_id", s.user.id).maybeSingle();
    if (!m) return NextResponse.json({ error: "Join this room before connecting" }, { status: 403 });
    // Capacity is enforced in the database (also records presence/heartbeat). Runs as the caller, never the service role.
    const { error: joinErr } = await s.supabase.rpc("voice_join", { p_group: g.id });
    const fail = mapVoiceJoinError(joinErr);
    if (fail) return NextResponse.json({ error: fail.message, code: fail.code }, { status: fail.status });
    room = `group-${g.id}`;
  } else {
    const { data: c } = await s.supabase.from("friend_calls").select("room, status, created_at, caller_id, callee_id").eq("id", parsed.data.callId).maybeSingle();
    const fresh = c && Date.now() - new Date(c.created_at).getTime() < 2 * 60 * 60 * 1000;
    if (!c || !fresh || !["ringing", "accepted"].includes(c.status) || (c.caller_id !== s.user.id && c.callee_id !== s.user.id))
      return NextResponse.json({ error: "Call not available" }, { status: 403 });
    room = c.room;
  }

  const at = new AccessToken(serverEnv("LIVEKIT_API_KEY"), serverEnv("LIVEKIT_API_SECRET"), { identity: s.user.id, name: s.profile.display_name, ttl: "1h" });
  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true, canPublishData: false });
  return NextResponse.json({ token: await at.toJwt(), url: serverEnv("LIVEKIT_URL"), room }, { headers: { "cache-control": "no-store" } });
}
