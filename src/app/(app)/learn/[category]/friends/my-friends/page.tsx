import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Search, UserMinus, UserPlus, Check, X } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { requireSession } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import type { PublicProfile } from "@/lib/groups";
import { livekitConfigured } from "@/lib/config";
import { removeFriendAction, respondFriendRequestAction, sendFriendRequestAction, startCallAction } from "../actions";

export const metadata: Metadata = { title: "My Friends" };

const btn = "inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-semibold";

export default async function MyFriends({ params, searchParams }: PageProps<"/learn/[category]/friends/my-friends">) {
  const { category } = await params;
  const sp = await searchParams;
  const { supabase, user } = await requireSession();
  const info = getCategory(category)!;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 40).replace(/[%,()*\\]/g, "") : "";

  const [{ data: fships }, { data: reqs }] = await Promise.all([
    supabase.from("friendships").select("user_a, user_b"),
    supabase.from("friend_requests").select("id, sender_id, receiver_id").eq("status", "pending"),
  ]);
  const friendIds = (fships ?? []).map((f) => (f.user_a === user.id ? f.user_b : f.user_a));
  const incoming = (reqs ?? []).filter((r) => r.receiver_id === user.id);
  const outgoing = (reqs ?? []).filter((r) => r.sender_id === user.id);
  const relatedIds = [...new Set([...friendIds, ...incoming.map((r) => r.sender_id), ...outgoing.map((r) => r.receiver_id)])];

  let results: PublicProfile[] = [];
  if (q.length >= 2) {
    const { data } = await supabase.from("public_profiles").select("*").neq("id", user.id)
      .or(`student_id.ilike.${q},display_name.ilike.%${q}%`).limit(20);
    results = (data ?? []) as PublicProfile[];
  }
  const { data: related } = relatedIds.length ? await supabase.from("public_profiles").select("*").in("id", relatedIds) : { data: [] };
  const prof = new Map(((related ?? []) as PublicProfile[]).map((p) => [p.id, p]));
  const name = (id: string) => prof.get(id)?.display_name ?? "Student";
  const sid = (id: string) => prof.get(id)?.student_id ?? "";
  const base = `/learn/${category}/friends`;
  const hidden = (id: string) => <><input type="hidden" name="id" value={id} /><input type="hidden" name="category" value={category} /></>;
  const card = "rounded-lg border border-border bg-card p-5";

  return (
    <>
      <PageHeader title="My Friends" crumbs={[{ label: info.name, href: `/learn/${category}` }, { label: "Learn With Friends", href: base }, { label: "My Friends" }]} />
      <div className="space-y-8">
        <section className={card} aria-labelledby="find">
          <h2 id="find" className="font-bold">Find students</h2>
          <form role="search" className="mt-3 flex gap-2">
            <label htmlFor="q" className="sr-only">Search by name or Student ID</label>
            <input id="q" name="q" defaultValue={q} placeholder="Name or Student ID (e.g. OL-2026-000123)" className="h-11 w-full max-w-md rounded-md border border-border bg-background px-4 text-sm" />
            <button className={`${btn} h-11 bg-primary px-5 text-on-primary hover:bg-primary-hover`}><Search size={16} aria-hidden="true" />Search</button>
          </form>
          {q.length >= 2 && (
            <ul className="mt-4 divide-y divide-border">
              {results.map((p) => {
                const isFriend = friendIds.includes(p.id), pendingOut = outgoing.some((r) => r.receiver_id === p.id), pendingIn = incoming.some((r) => r.sender_id === p.id);
                return (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <Link href={`${base}/my-friends/${p.student_id}`} className="hover:underline"><strong>{p.display_name}</strong> <span className="font-mono text-xs text-muted-foreground">{p.student_id}</span></Link>
                    {isFriend ? <span className="text-sm text-muted-foreground">Friends</span>
                      : pendingOut ? <span className="text-sm text-muted-foreground">Request sent</span>
                      : <form action={sendFriendRequestAction}>{hidden(p.id)}<button className={`${btn} bg-primary text-on-primary hover:bg-primary-hover`}><UserPlus size={14} aria-hidden="true" />{pendingIn ? "Accept (they asked)" : "Add friend"}</button></form>}
                  </li>
                );
              })}
              {!results.length && <li className="py-4 text-sm text-muted-foreground">No students found for “{q}”.</li>}
            </ul>
          )}
        </section>

        {incoming.length > 0 && (
          <section className={card} aria-labelledby="inc">
            <h2 id="inc" className="font-bold">Friend requests ({incoming.length})</h2>
            <ul className="mt-3 divide-y divide-border">
              {incoming.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span><strong>{name(r.sender_id)}</strong> <span className="font-mono text-xs text-muted-foreground">{sid(r.sender_id)}</span></span>
                  <span className="flex gap-2">
                    <form action={respondFriendRequestAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="accept" value="1" /><button className={`${btn} bg-success text-white`}><Check size={14} aria-hidden="true" />Accept</button></form>
                    <form action={respondFriendRequestAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="accept" value="0" /><button className={`${btn} border border-border hover:bg-muted`}><X size={14} aria-hidden="true" />Reject</button></form>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={card} aria-labelledby="fr">
          <h2 id="fr" className="font-bold">Your friends ({friendIds.length})</h2>
          {friendIds.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No friends yet. Search above, or share your Student ID from the dashboard.</p> : (
            <ul className="mt-3 divide-y divide-border">
              {friendIds.map((id) => (
                <li key={id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <Link href={`${base}/my-friends/${sid(id)}`} className="hover:underline"><strong>{name(id)}</strong> <span className="font-mono text-xs text-muted-foreground">{sid(id)}</span></Link>
                  <span className="flex flex-wrap gap-2">
                    {livekitConfigured() && <form action={startCallAction}>{hidden(id)}<button className={`${btn} bg-primary text-on-primary hover:bg-primary-hover`}><Phone size={14} aria-hidden="true" />Call</button></form>}
                    <Link href={`${base}/chat/mine`} className={`${btn} border border-border hover:bg-muted`}>Group Chat</Link>
                    <Link href={`${base}/discussion/mine`} className={`${btn} border border-border hover:bg-muted`}>Discussion</Link>
                    <form action={removeFriendAction}>{hidden(id)}<button className={`${btn} text-destructive hover:bg-muted`} aria-label={`Remove ${name(id)}`}><UserMinus size={14} aria-hidden="true" />Remove</button></form>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!livekitConfigured() && friendIds.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Calling is hidden until LiveKit is configured on the server.</p>}
        </section>

        {outgoing.length > 0 && (
          <section className={card}><h2 className="font-bold">Sent requests</h2>
            <ul className="mt-3 text-sm text-muted-foreground">{outgoing.map((r) => <li key={r.id}>Waiting for {name(r.receiver_id)}</li>)}</ul></section>
        )}
      </div>
    </>
  );
}
