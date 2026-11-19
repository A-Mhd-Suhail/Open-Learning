import type { Metadata } from "next";
import { PendingButton } from "@/components/ui/pending-button";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { CopyButton } from "@/components/app/CopyButton";
import { ChatRoom } from "@/components/app/ChatRoom";
import { VoiceRoom } from "@/components/app/VoiceRoom";
import { requireSession } from "@/lib/auth";
import { getCategory, isLanguageCategory } from "@/lib/categories";
import { Avatar } from "@/components/ui/avatar";
import { capacityLabel } from "@/lib/voice/helpers";
import { KIND_INFO, isUuid, type ChatMessage, type Group, type Kind } from "@/lib/groups";
import { joinGroupAction, leaveGroupAction } from "../../actions";
import { livekitConfigured } from "@/lib/config";

export const metadata: Metadata = { title: "Group" };
const PAGE = 50;

/** Participants whose heartbeat is fresher than 90s (same window the database uses for capacity). */
async function liveCount(supabase: Awaited<ReturnType<typeof requireSession>>["supabase"], groupId: string) {
  const since = new Date(Date.now() - 90_000).toISOString();
  const { count } = await supabase.from("voice_participants").select("user_id", { count: "exact", head: true }).eq("group_id", groupId).gt("last_seen", since);
  return count ?? 0;
}

export default async function GroupPage({ params }: PageProps<"/learn/[category]/friends/[kind]/[groupId]">) {
  const { category, kind, groupId } = await params;
  if (!isUuid(groupId)) notFound();
  const { supabase, user } = await requireSession();
  const { data } = await supabase.from("groups").select("*").eq("id", groupId).maybeSingle();
  const group = data as Group | null;
  // RLS hides private groups from non-members; also enforce that the URL's category/kind match the group.
  if (!group || group.category !== category || group.type !== kind) notFound();

  const info = getCategory(category)!, k = KIND_INFO[kind as Kind];
  const isLang = isLanguageCategory(category) && (kind === "voice" || kind === "chat");
  const crumbs = isLang
    ? [{ label: info.name, href: `/learn/${category}` }, { label: kind === "voice" ? "Voice rooms" : "Chat rooms", href: `/learn/${category}/${kind}` }, { label: group.name }]
    : [{ label: info.name, href: `/learn/${category}` }, { label: k.title, href: `/learn/${category}/friends/${kind}` }, { label: group.name }];
  const { data: me } = await supabase.from("group_members").select("role").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();

  if (!me) {
    return (
      <>
        <PageHeader title={group.name} description={group.description || undefined} crumbs={crumbs} />
        <form action={joinGroupAction} className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-muted-foreground">{isLang ? "Join this room to take part." : "Join this group to read and take part in the conversation."}</p>
          <input type="hidden" name="id" value={group.id} /><input type="hidden" name="category" value={category} /><input type="hidden" name="kind" value={kind} />
          <PendingButton className="h-11 cursor-pointer rounded-md bg-primary px-6 text-sm font-semibold text-on-primary hover:bg-primary-hover">{isLang ? "Join room" : "Join group"}</PendingButton>
        </form>
      </>
    );
  }

  const { data: members } = await supabase.from("group_members").select("user_id, role").eq("group_id", groupId);
  const ids = (members ?? []).map((m) => m.user_id);
  let msgs: ChatMessage[] = [];
  if (kind !== "voice") {
    const { data: rows } = await supabase.from("messages").select("*").eq("group_id", groupId).order("id", { ascending: false }).limit(PAGE);
    msgs = ((rows ?? []) as ChatMessage[]).reverse();
  }
  const allIds = [...new Set([...ids, ...msgs.map((m) => m.user_id)])];
  const { data: profiles } = allIds.length ? await supabase.from("public_profiles").select("id, display_name, student_id, avatar_url").in("id", allIds) : { data: [] };
  const names = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const creator = group.created_by ? names[group.created_by]?.display_name ?? null : null;
  let live = 0;
  if (isLang && kind === "voice") {
    live = await liveCount(supabase, groupId);
  }
  const full = !!group.max_participants && live >= group.max_participants;
  const invite = `/learn/${category}/friends/join/${group.invite_code}`;

  return (
    <>
      <PageHeader title={group.name} description={group.description || undefined} crumbs={crumbs} />
      {isLang && (
        <dl className="mb-6 flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-border bg-card p-4 text-sm" aria-label="Room details">
          {group.language && <div><dt className="text-xs text-muted-foreground">Language</dt><dd className="font-semibold">{group.language}</dd></div>}
          <div><dt className="text-xs text-muted-foreground">Created by</dt><dd className="font-semibold">{creator ?? "A student"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Visibility</dt><dd className="font-semibold capitalize">{group.visibility}</dd></div>
          {kind === "voice" && (
            <>
              <div><dt className="text-xs text-muted-foreground">Participants</dt><dd className="font-semibold">{capacityLabel(live, group.max_participants)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="font-semibold">{full ? "Full" : live > 0 ? "Live" : "Open"}</dd></div>
            </>
          )}
        </dl>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          {kind === "voice"
            ? (livekitConfigured()
              ? <VoiceRoom target={{ groupId }} />
              : <div className="rounded-lg border border-dashed border-border bg-card p-8 text-muted-foreground" role="status">Voice is not configured on this server yet (LiveKit keys missing). Text groups work normally.</div>)
            : <ChatRoom groupId={groupId} userId={user.id} variant={kind as "chat" | "discussion"} initialMessages={msgs} initialNames={names} hasMoreInitial={msgs.length === PAGE} />}
        </div>
        <aside className="space-y-5">
          <section className="rounded-lg border border-border bg-card p-4" aria-labelledby="mem">
            <h2 id="mem" className="font-bold">Members ({ids.length})</h2>
            <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
              {(members ?? []).map((m) => (
                <li key={m.user_id} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    {isLang && <Avatar name={names[m.user_id]?.display_name ?? "Student"} src={names[m.user_id]?.avatar_url} size="sm" />}
                    <span className="truncate">{names[m.user_id]?.display_name ?? "Student"}{m.user_id === user.id && " (you)"}</span>
                  </span>
                  {m.role === "owner" && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">Owner</span>}
                </li>
              ))}
            </ul>
          </section>
          {!group.is_general && (!isLang || group.visibility === "private") && (
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-bold">Invite link</h2>
              <p className="mt-1 text-xs text-muted-foreground">Anyone signed in with this link can join{group.visibility === "private" ? ` this private ${isLang ? "room" : "group"}` : ""}.</p>
              <div className="mt-2 flex items-center gap-1"><code className="flex-1 truncate rounded-lg bg-muted px-2 py-1.5 text-xs">{invite}</code><CopyButton value={invite} label="Copy invite path" /></div>
            </section>
          )}
          <form action={leaveGroupAction}>
            <input type="hidden" name="id" value={group.id} /><input type="hidden" name="category" value={category} /><input type="hidden" name="kind" value={kind} />
            <PendingButton className="h-11 w-full cursor-pointer rounded-md border border-border text-sm font-semibold text-destructive hover:bg-muted">{isLang ? "Leave room" : "Leave group"}</PendingButton>
          </form>
        </aside>
      </div>
    </>
  );
}
