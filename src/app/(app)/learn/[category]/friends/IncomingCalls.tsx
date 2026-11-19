"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, PhoneOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Call = { id: string; caller_id: string; callerName: string };

/** Listens (Supabase Realtime, RLS-filtered) for calls ringing this student and offers accept/decline. */
export function IncomingCalls({ userId, category }: { userId: string; category: string }) {
  const router = useRouter();
  const [calls, setCalls] = useState<Call[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let ch: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    (async () => {
      // This banner mounts with the page layout, often before the browser client has handed the user's JWT to
      // Realtime. Without it, row-level security is evaluated as `anon` and events arrive as "401 Unauthorized"
      // with an empty record. Set the token explicitly before subscribing.
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) await supabase.realtime.setAuth(session.access_token);
      if (cancelled) return;
      ch = supabase.channel(`calls:${userId}`).on(
        "postgres_changes", { event: "INSERT", schema: "public", table: "friend_calls", filter: `callee_id=eq.${userId}` },
        async (payload) => {
          const row = payload.new as { id: string; caller_id: string };
          if (!row.id) return;
          const { data } = await supabase.from("public_profiles").select("display_name").eq("id", row.caller_id).single();
          setCalls((c) => [...c, { id: row.id, caller_id: row.caller_id, callerName: data?.display_name ?? "A friend" }]);
          setTimeout(() => setCalls((c) => c.filter((x) => x.id !== row.id)), 45_000);
        },
      ).subscribe();
    })();
    return () => { cancelled = true; if (ch) void supabase.removeChannel(ch); };
  }, [userId]);

  async function respond(c: Call, status: "accepted" | "declined") {
    await createClient().rpc("respond_friend_call", { p_call: c.id, p_status: status });
    setCalls((l) => l.filter((x) => x.id !== c.id));
    if (status === "accepted") router.push(`/learn/${category}/friends/call/${c.id}`);
  }

  if (!calls.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3" role="alert" aria-live="assertive">
      {calls.map((c) => (
        <div key={c.id} className="flex w-80 items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-lg">
          <Phone className="text-primary" size={22} aria-hidden="true" />
          <p className="flex-1 text-sm"><strong>{c.callerName}</strong> is calling you</p>
          <button onClick={() => respond(c, "declined")} aria-label="Decline call" className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-destructive text-white"><PhoneOff size={18} /></button>
          <button onClick={() => respond(c, "accepted")} aria-label="Accept call" className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-success text-white"><Phone size={18} /></button>
        </div>
      ))}
    </div>
  );
}
