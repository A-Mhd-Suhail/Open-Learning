import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { VoiceRoom } from "@/components/app/VoiceRoom";
import { requireSession } from "@/lib/auth";
import { isUuid } from "@/lib/groups";
import { livekitConfigured } from "@/lib/config";
import { CallEnder } from "./CallEnder";

export const metadata: Metadata = { title: "Call" };

export default async function CallPage({ params }: PageProps<"/learn/[category]/friends/call/[callId]">) {
  const { category, callId } = await params;
  if (!isUuid(callId)) notFound();
  const { supabase, user } = await requireSession();
  const { data: call } = await supabase.from("friend_calls").select("id, caller_id, callee_id, status").eq("id", callId).maybeSingle();
  if (!call) notFound();
  const otherId = call.caller_id === user.id ? call.callee_id : call.caller_id;
  const { data: other } = await supabase.from("public_profiles").select("display_name").eq("id", otherId).maybeSingle();
  return (
    <>
      <PageHeader title={`Call with ${other?.display_name ?? "friend"}`} crumbs={[{ label: "Learn With Friends", href: `/learn/${category}/friends` }, { label: "Call" }]} />
      {!livekitConfigured()
        ? <div className="rounded-lg border border-dashed border-border bg-card p-8 text-muted-foreground" role="status">Calling is not configured on this server yet (LiveKit keys missing).</div>
        : <CallEnder callId={callId} category={category}><VoiceRoom target={{ callId }} leaveLabel="End call" /></CallEnder>}
    </>
  );
}
