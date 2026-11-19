import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Compass, FileText, Headphones, MessageCircle, Settings2, Users } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { requireLanguageProfile } from "@/lib/language/profile";
import { PROFICIENCY_LABEL } from "@/lib/language/languages";
import type { FeedPost, LanguageRoom } from "@/lib/language/types";
import type { PublicProfile } from "@/lib/groups";

const BASE = "/learn/languages";
const card = "rounded-lg border border-border bg-card p-5";
const fmt = (iso: string) => new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date(iso));
const monthYear = (iso: string) => new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(iso));

function Section({ id, icon: Icon, title, href, linkLabel = "View all", children }: { id: string; icon: typeof Users; title: string; href?: string; linkLabel?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={card}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="flex items-center gap-2 text-base font-bold"><Icon size={18} aria-hidden="true" className="text-primary" />{title}</h2>
        {href && <Link href={href} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline">{linkLabel}<ArrowRight size={14} aria-hidden="true" /></Link>}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Empty({ text, href, cta }: { text: string; href?: string; cta?: string }) {
  return (
    <div className="py-3 text-sm text-muted-foreground">
      <p>{text}</p>
      {href && cta && <Link href={href} className="mt-1 inline-flex min-h-11 items-center font-semibold text-primary hover:underline">{cta}</Link>}
    </div>
  );
}

function RoomList({ rooms, kind, empty }: { rooms: LanguageRoom[]; kind: "voice" | "chat"; empty: string }) {
  if (!rooms.length) return <Empty text={empty} href={`${BASE}/${kind}`} cta={`Create the first ${kind} room`} />;
  return (
    <ul className="divide-y divide-border">
      {rooms.map((r) => (
        <li key={r.id}>
          <Link href={`${BASE}/friends/${kind}/${r.id}`} className="flex min-h-11 items-center justify-between gap-3 py-2.5 hover:underline">
            <span className="min-w-0"><span className="block truncate font-medium">{r.name}</span><span className="block truncate text-xs text-muted-foreground">{r.language ?? "Any language"}</span></span>
            <span className="shrink-0 text-xs text-muted-foreground">{kind === "voice" && r.live_count > 0 ? `${r.live_count} live` : `${r.member_count} member${r.member_count === 1 ? "" : "s"}`}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export async function LanguageDashboard() {
  const { supabase, user, profile, languageProfile: lp } = await requireLanguageProfile();
  const mine = [lp.target_language, ...lp.known_languages];
  // PostgREST list values: quote, and skip labels that would need escaping.
  const safe = mine.filter((l) => !/["\\]/.test(l)).map((l) => `"${l}"`).join(",");

  const [voice, chat, feed, fships, myPosts, myRooms, peers] = await Promise.all([
    supabase.rpc("language_rooms", { p_type: "voice" }),
    supabase.rpc("language_rooms", { p_type: "chat" }),
    supabase.rpc("community_feed", { p_limit: 3 }),
    supabase.from("friendships").select("user_a, user_b, created_at").order("created_at", { ascending: false }),
    supabase.from("posts").select("id, body, created_at").eq("author_id", user.id).order("created_at", { ascending: false }).limit(3),
    supabase.from("group_members").select("joined_at, groups!inner(id, name, type, category)").eq("user_id", user.id)
      .eq("groups.category", "languages").order("joined_at", { ascending: false }).limit(3),
    safe ? supabase.from("language_profiles").select("user_id, target_language, known_languages, proficiency")
      .neq("user_id", user.id).eq("discoverable", true)
      .or(`target_language.in.(${safe}),known_languages.ov.{${safe}}`).order("updated_at", { ascending: false }).limit(4)
      : Promise.resolve({ data: [] as { user_id: string; target_language: string; known_languages: string[]; proficiency: string }[] }),
  ]);

  const voiceRooms = ((voice.data ?? []) as LanguageRoom[]).slice(0, 3);
  const chatRooms = ((chat.data ?? []) as LanguageRoom[]).slice(0, 3);
  const posts = (feed.data ?? []) as FeedPost[];
  const friendships = (fships.data ?? []) as { user_a: string; user_b: string; created_at: string }[];
  const friendRows = friendships.map((f) => ({ id: f.user_a === user.id ? f.user_b : f.user_a, at: f.created_at }));
  const peerRows = peers.data ?? [];

  const ids = [...new Set([...friendRows.slice(0, 5).map((f) => f.id), ...posts.map((p) => p.author_id), ...peerRows.map((p) => p.user_id)])];
  const { data: people } = ids.length ? await supabase.from("public_profiles").select("*").in("id", ids) : { data: [] };
  const byId = new Map(((people ?? []) as PublicProfile[]).map((p) => [p.id, p]));
  const nameOf = (id: string) => byId.get(id)?.display_name ?? "Student";

  type Activity = { at: string; text: string; href: string };
  const activity: Activity[] = [
    ...((myPosts.data ?? []) as { id: string; body: string; created_at: string }[]).map((p) => ({ at: p.created_at, text: "You posted in the community", href: `${BASE}/community/${p.id}` })),
    ...(((myRooms.data ?? []) as unknown as { joined_at: string; groups: { id: string; name: string; type: string } }[])).filter((m) => m.groups).map((m) => ({ at: m.joined_at, text: `You joined ${m.groups.type} room "${m.groups.name}"`, href: `${BASE}/friends/${m.groups.type}/${m.groups.id}` })),
    ...friendRows.slice(0, 3).map((f) => ({ at: f.at, text: `You and ${nameOf(f.id)} became friends`, href: `${BASE}/friends/my-friends` })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 5);

  return (
    <>
      <PageHeader title="Language Learning" description={`Welcome back, ${profile.display_name.split(" ")[0]}.`}
        crumbs={[{ label: "Learn", href: "/learn" }, { label: "Language Learning" }]} />
      <div className="space-y-5">
        <section aria-labelledby="overview" className="rounded-lg bg-band p-6 text-on-band sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-band-muted">You are learning</p>
              <h2 id="overview" className="font-display text-3xl font-bold sm:text-4xl">{lp.target_language}</h2>
              <p className="mt-2 text-sm text-band-muted">
                {PROFICIENCY_LABEL[lp.proficiency]} level
                {lp.known_languages.length > 0 && <> · You know {lp.known_languages.join(", ")}</>}
                <> · Member since {monthYear(lp.created_at)}</>
              </p>
            </div>
            <Link href={`${BASE}/preferences`} className="inline-flex h-11 items-center gap-2 rounded-md border border-band-muted/50 px-4 text-sm font-semibold hover:bg-white/10"><Settings2 size={16} aria-hidden="true" />Edit preferences</Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href={`${BASE}/voice`} variant="accent"><Headphones size={16} aria-hidden="true" />Join a voice room</ButtonLink>
            <Link href={`${BASE}/community`} className="inline-flex h-11 items-center gap-2 rounded-md border border-band-muted/50 px-5 text-sm font-semibold hover:bg-white/10"><FileText size={16} aria-hidden="true" />Browse community</Link>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <Section id="voice" icon={Headphones} title="Voice Rooms" href={`${BASE}/voice`}><RoomList rooms={voiceRooms} kind="voice" empty="No voice rooms yet." /></Section>
          <Section id="chat" icon={MessageCircle} title="Chat Rooms" href={`${BASE}/chat`}><RoomList rooms={chatRooms} kind="chat" empty="No chat rooms yet." /></Section>

          <Section id="posts" icon={FileText} title="Community posts" href={`${BASE}/community`}>
            {posts.length === 0 ? <Empty text="No posts yet. Share how your practice is going." href={`${BASE}/community/new`} cta="Write the first post" /> : (
              <ul className="divide-y divide-border">
                {posts.map((p) => (
                  <li key={p.id}>
                    <Link href={`${BASE}/community/${p.id}`} className="block py-2.5 hover:underline">
                      <span className="block text-xs text-muted-foreground">{nameOf(p.author_id)} · {fmt(p.created_at)}{p.language ? ` · ${p.language}` : ""}</span>
                      <span className="line-clamp-2 text-sm">{p.body || "Photo post"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section id="friends" icon={Users} title="Friends" href={`${BASE}/friends/my-friends`}>
            {friendRows.length === 0 ? <Empty text="You have not added any friends yet." href={`${BASE}/friends/my-friends`} cta="Find students" /> : (
              <ul className="divide-y divide-border">
                {friendRows.slice(0, 4).map((f) => {
                  const p = byId.get(f.id);
                  return (
                    <li key={f.id}>
                      <Link href={p ? `${BASE}/friends/my-friends/${p.student_id}` : `${BASE}/friends/my-friends`} className="flex min-h-11 items-center gap-3 py-2 hover:underline">
                        <Avatar name={nameOf(f.id)} size="sm" /><span className="truncate text-sm font-medium">{nameOf(f.id)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {friendRows.length > 4 && <p className="mt-1 text-xs text-muted-foreground">and {friendRows.length - 4} more</p>}
          </Section>

          <Section id="discover" icon={Compass} title="Discover learners" href={`${BASE}/friends/my-friends`} linkLabel="Find students">
            {peerRows.length === 0 ? <Empty text="No learners with matching languages yet. Check back as more students join." /> : (
              <ul className="divide-y divide-border">
                {peerRows.map((p) => {
                  const pub = byId.get(p.user_id);
                  if (!pub) return null;
                  return (
                    <li key={p.user_id}>
                      <Link href={`${BASE}/friends/my-friends/${pub.student_id}`} className="flex min-h-11 items-center gap-3 py-2 hover:underline">
                        <Avatar name={pub.display_name} size="sm" />
                        <span className="min-w-0"><span className="block truncate text-sm font-medium">{pub.display_name}</span>
                          <span className="block truncate text-xs text-muted-foreground">Learning {p.target_language} · {PROFICIENCY_LABEL[p.proficiency as keyof typeof PROFICIENCY_LABEL] ?? p.proficiency}</span></span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section id="activity" icon={ArrowRight} title="Recent activity">
            {activity.length === 0 ? <Empty text="Your activity will show up here once you join a room, post or add a friend." /> : (
              <ul className="divide-y divide-border">
                {activity.map((a, i) => (
                  <li key={i}><Link href={a.href} className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm hover:underline"><span className="min-w-0 truncate">{a.text}</span><span className="shrink-0 text-xs text-muted-foreground">{fmt(a.at)}</span></Link></li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
