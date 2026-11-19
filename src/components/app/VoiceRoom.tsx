"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Headphones, Loader2, RefreshCw, Users } from "lucide-react";
import { Room, RoomEvent, Track, ConnectionState, type Participant } from "livekit-client";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { HEARTBEAT_MS } from "@/lib/voice/helpers";

type P = { id: string; name: string; speaking: boolean; muted: boolean; me: boolean };
type Phase = "idle" | "mic" | "connecting" | "connected" | "reconnecting" | "error" | "full";

/** Real WebRTC audio via LiveKit. The token comes from /api/livekit-token, which checks authorisation and (for group rooms) capacity. */
export function VoiceRoom({ target, onLeave, leaveLabel = "Leave room" }: { target: { groupId: string } | { callId: string }; onLeave?: () => void; leaveLabel?: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<P[]>([]);
  const [muted, setMuted] = useState(false);
  const room = useRef<Room | null>(null);
  const audioBox = useRef<HTMLDivElement>(null);
  const beat = useRef<ReturnType<typeof setInterval> | null>(null);
  const joined = useRef(false); // true while we hold a presence row that must be released
  const groupId = "groupId" in target ? target.groupId : null;

  const sync = useCallback(() => {
    const r = room.current; if (!r) return;
    const map = (p: Participant, me: boolean): P => ({ id: p.identity, name: p.name || "Student", speaking: p.isSpeaking, muted: !p.isMicrophoneEnabled, me });
    setPeople([map(r.localParticipant, true), ...[...r.remoteParticipants.values()].map((p) => map(p, false))]);
  }, []);

  /** Idempotent teardown: heartbeat, room, audio elements, presence row. */
  const teardown = useCallback(() => {
    if (beat.current) { clearInterval(beat.current); beat.current = null; }
    const r = room.current; room.current = null;
    if (r) {
      r.removeAllListeners();
      r.remoteParticipants.forEach((p) => p.trackPublications.forEach((pub) => pub.track?.detach().forEach((el) => el.remove())));
      r.disconnect();
    }
    if (audioBox.current) audioBox.current.replaceChildren();
    if (groupId && joined.current) { joined.current = false; void createClient().rpc("voice_leave", { p_group: groupId }); }
  }, [groupId]);

  const leave = useCallback(() => {
    teardown(); setPeople([]); setPhase("idle"); setMuted(false); setError(null);
  }, [teardown]);

  // Unmount + tab close/navigation away. Server-side last_seen expiry (90s) is the backstop if the request is dropped.
  useEffect(() => {
    const onHide = () => teardown();
    window.addEventListener("pagehide", onHide);
    return () => { window.removeEventListener("pagehide", onHide); teardown(); };
  }, [teardown]);

  async function join() {
    setError(null); setPhase("mic");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
    } catch (e) {
      const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
      setError(denied ? "Microphone access was blocked. Allow the microphone in your browser's address bar, then try again."
        : e instanceof DOMException && e.name === "NotFoundError" ? "No microphone was found on this device." : "Your browser cannot access a microphone here (HTTPS or localhost is required).");
      setPhase("error"); return;
    }
    setPhase("connecting");
    try {
      const res = await fetch("/api/livekit-token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(target) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 || data.code === "full") { setError(data.error ?? "This room is full right now."); setPhase("full"); return; }
      if (!res.ok) throw new Error(data.error ?? "Could not get a voice token.");
      if (groupId) joined.current = true; // the token route already recorded presence
      const r = new Room({ adaptiveStream: true, dynacast: true });
      room.current = r;
      r.on(RoomEvent.TrackSubscribed, (t) => { if (t.kind === Track.Kind.Audio) audioBox.current?.appendChild(t.attach()); })
        .on(RoomEvent.TrackUnsubscribed, (t) => { t.detach().forEach((el) => el.remove()); })
        .on(RoomEvent.ParticipantConnected, sync).on(RoomEvent.ParticipantDisconnected, sync)
        .on(RoomEvent.ActiveSpeakersChanged, sync).on(RoomEvent.TrackMuted, sync).on(RoomEvent.TrackUnmuted, sync)
        .on(RoomEvent.Reconnecting, () => setPhase("reconnecting"))
        .on(RoomEvent.Reconnected, () => { setPhase("connected"); sync(); })
        .on(RoomEvent.Disconnected, () => {
          if (room.current !== r) return; // deliberate leave already handled
          teardown(); setPeople([]); setPhase("idle"); setMuted(false);
          setError("You were disconnected from the room."); 
        });
      await r.connect(data.url, data.token);
      await r.localParticipant.setMicrophoneEnabled(true);
      await r.startAudio().catch(() => {});
      if (r.state === ConnectionState.Connected) setPhase("connected");
      sync();
      if (groupId) {
        beat.current = setInterval(async () => {
          const { error: e } = await createClient().rpc("voice_join", { p_group: groupId });
          // A heartbeat can only be refused if membership was lost; drop out cleanly in that case.
          if (e && e.code === "42501") { leave(); setError("You are no longer a member of this room."); }
        }, HEARTBEAT_MS);
      }
    } catch (e) {
      teardown();
      setError(e instanceof Error ? e.message : "Could not connect."); setPhase("error");
    }
  }

  async function toggleMute() {
    const r = room.current; if (!r) return;
    const next = !muted; await r.localParticipant.setMicrophoneEnabled(!next); setMuted(next); sync();
  }

  const busy = phase === "mic" || phase === "connecting";
  const live = phase === "connected" || phase === "reconnecting";
  const status =
    phase === "idle" ? "Not connected" : phase === "mic" ? "Waiting for microphone permission…" : phase === "connecting" ? "Connecting…"
    : phase === "connected" ? `Connected · ${people.length} in room` : phase === "reconnecting" ? "Connection lost. Reconnecting…"
    : phase === "full" ? "Room is full" : "Could not connect";
  const dot = phase === "connected" ? "bg-success" : phase === "reconnecting" || busy ? "bg-accent motion-safe:animate-pulse" : phase === "full" || phase === "error" ? "bg-destructive" : "bg-muted-foreground";

  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-6" aria-label="Voice room">
      <div ref={audioBox} className="hidden" aria-hidden="true" />
      <p className="flex items-center gap-2 text-sm font-semibold" role="status" aria-live="polite">
        <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />{status}
      </p>
      {error && <p role="alert" className="mt-3 rounded-md border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
      {phase === "full" && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Users size={16} aria-hidden="true" />Someone needs to leave before you can join. Spots free up automatically.</p>
      )}
      {live && (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Participants">
          {people.map((p) => (
            <li key={p.id} className={`flex min-h-14 items-center gap-3 rounded-md border p-3 transition-colors motion-reduce:transition-none ${p.speaking && !p.muted ? "border-success bg-success/5" : "border-border"}`}>
              <Avatar name={p.name} size="md" className={p.speaking && !p.muted ? "ring-2 ring-success ring-offset-2 ring-offset-card" : ""} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}{p.me && " (you)"}</span>
              {p.muted ? <MicOff size={16} className="shrink-0 text-muted-foreground" aria-label="Muted" /> : <Mic size={16} className={`shrink-0 ${p.speaking ? "text-success" : "text-muted-foreground"}`} aria-label={p.speaking ? "Speaking" : "Mic on"} />}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        {live ? (
          <>
            <Button variant="secondary" onClick={toggleMute} aria-pressed={muted} disabled={phase === "reconnecting"}>{muted ? <MicOff size={16} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}{muted ? "Unmute microphone" : "Mute microphone"}</Button>
            <Button onClick={() => { leave(); onLeave?.(); }} className="bg-destructive text-on-primary hover:bg-destructive hover:brightness-95"><PhoneOff size={16} aria-hidden="true" />{leaveLabel}</Button>
          </>
        ) : (
          <Button onClick={join} disabled={busy}>
            {busy ? <Loader2 size={16} aria-hidden="true" className="motion-safe:animate-spin" /> : phase === "full" || phase === "error" ? <RefreshCw size={16} aria-hidden="true" /> : <Headphones size={16} aria-hidden="true" />}
            {busy ? "Joining…" : phase === "full" ? "Try again" : phase === "error" ? "Try again" : "Join voice"}
          </Button>
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Audio is sent only while you are connected. Use headphones to avoid echo.</p>
    </section>
  );
}
