import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Languages, PlayCircle, UserPlus, Users, type LucideIcon } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button";
import { ComingSoonBadge } from "@/components/ui/coming-soon";
import { StudentCard } from "@/components/app/StudentCard";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/components/icons";
import { KIND_INFO, groupPath, type Kind } from "@/lib/groups";

export const metadata: Metadata = { title: "Dashboard" };

const when = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));

type Activity = { key: string; at: string; title: string; meta: string; href: string };

function QuickAction({ href, icon: Icon, title, hint }: { href: string; icon: LucideIcon; title: string; hint: string }) {
  return (
    <Link href={href} className="group flex min-h-[4.5rem] items-center gap-4 bg-card px-4 py-4 transition-colors duration-150 hover:bg-muted sm:px-5">
      <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-band text-accent"><Icon size={20} strokeWidth={1.6} /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-semibold leading-snug">{title}</span>
        <span className="block truncate text-sm text-muted-foreground">{hint}</span>
      </span>
      <ArrowRight size={16} aria-hidden="true" className="shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground motion-reduce:transition-none" />
    </Link>
  );
}

export default async function DashboardPage() {
  const { profile, supabase, user } = await requireSession();
  const first = profile.display_name.split(" ")[0];
  const current = profile.category ? getCategory(profile.category) : undefined;
  const slug = current?.slug ?? "school";
  const name = current?.name ?? "School";

  // Only what the student's own RLS client can honestly see: groups they joined and posts they wrote. One round trip.
  const [joined, posts] = await Promise.all([
    supabase.from("group_members").select("joined_at, groups!inner(id, name, type, category)").eq("user_id", user.id).order("joined_at", { ascending: false }).limit(4),
    supabase.from("posts").select("id, body, created_at").eq("author_id", user.id).order("created_at", { ascending: false }).limit(3),
  ]);

  const activity: Activity[] = [
    ...((joined.data ?? []) as unknown as { joined_at: string; groups: { id: string; name: string; type: Kind; category: string } | null }[])
      .filter((m) => m.groups && m.groups.type in KIND_INFO)
      .map((m) => ({
        key: `g-${m.groups!.id}`, at: m.joined_at, title: `Joined ${m.groups!.name}`,
        meta: `${getCategory(m.groups!.category)?.name ?? m.groups!.category} · ${KIND_INFO[m.groups!.type].title}`,
        href: groupPath(m.groups!.category, m.groups!.type, m.groups!.id),
      })),
    ...((posts.data ?? []) as { id: string; body: string; created_at: string }[]).map((p) => ({
      key: `p-${p.id}`, at: p.created_at, title: "You posted in the community", meta: p.body ? p.body.slice(0, 60) : "Photo post", href: `/learn/languages/community/${p.id}`,
    })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 5);

  return (
    <div className="space-y-12 lg:space-y-16">
      {/* Where you are, and the one thing to do next. */}
      <section aria-labelledby="welcome" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-14">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{current ? `Your path · ${name}` : "Dashboard"}</p>
          <h1 id="welcome" className="mt-3 text-[2.25rem] leading-[1.08] sm:text-5xl lg:text-6xl">Welcome back, {first}</h1>
          <div className="foil mt-5" aria-hidden="true" />
          <p className="mt-5 max-w-md text-base text-muted-foreground">
            {current ? `Pick up your ${name} lessons, or study with friends in your groups.` : "Choose a path to begin: School, JEE or NEET, each with its own video library and study groups."}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href={current ? `/learn/${slug}/self-learning/videos` : "/learn"} variant="accent" size="lg" className="w-full sm:w-auto">
              <PlayCircle size={18} aria-hidden="true" />{current ? `Continue ${name} lessons` : "Start learning"}
            </ButtonLink>
            <ButtonLink href="/learn" variant="secondary" size="lg" className="w-full sm:w-auto">{current ? "Change path" : "See all paths"}</ButtonLink>
          </div>
        </div>
        <StudentCard name={profile.display_name} studentId={profile.student_id} role={profile.role === "admin" ? "Administrator" : "Student"} />
      </section>

      {/* Quick actions: one ruled block, not a grid of cards. */}
      <section aria-labelledby="quick">
        <h2 id="quick" className="mb-4 text-2xl">Jump back in</h2>
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
          <QuickAction href={`/learn/${slug}/self-learning/videos`} icon={PlayCircle} title="Video library" hint={`${name} lessons by class, subject and chapter`} />
          <QuickAction href={`/learn/${slug}/friends`} icon={Users} title="Study groups" hint={`Discussion, chat and voice for ${name}`} />
          <QuickAction href={`/learn/${slug}/friends/my-friends`} icon={UserPlus} title="Friends" hint="Find students by ID, chat and call" />
          <QuickAction href="/learn/languages" icon={Languages} title="Language learning" hint="Voice rooms, chat rooms and the community" />
        </div>
      </section>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-14">
        <section aria-labelledby="paths">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 id="paths" className="text-2xl">Learning paths</h2>
            <Link href="/learn" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-gold hover:underline">All paths<ArrowRight size={14} aria-hidden="true" /></Link>
          </div>
          <ul className="divide-y divide-border border-y border-border">
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICONS[c.icon];
              const row = (
                <>
                  <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.available ? "bg-band text-accent" : "border border-border text-muted-foreground"}`}><Icon size={18} strokeWidth={1.6} /></span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-display text-base font-semibold ${c.available ? "" : "text-muted-foreground"}`}>{c.name}</span>
                    <span className="block text-sm text-muted-foreground">{c.tagline}</span>
                  </span>
                  {!c.available ? <ComingSoonBadge /> : c.slug === profile.category ? <span className="shrink-0 rounded-full border border-accent/60 px-2.5 py-0.5 text-xs font-semibold text-gold">Your path</span> : <ArrowRight size={16} aria-hidden="true" className="shrink-0 text-muted-foreground" />}
                </>
              );
              return (
                <li key={c.slug}>
                  {c.available
                    ? <Link href={`/learn/${c.slug}`} className="flex min-h-[4.5rem] items-center gap-4 px-1 py-3.5 transition-colors hover:bg-muted/70 sm:px-3">{row}</Link>
                    : <div aria-disabled="true" className="flex min-h-[4.5rem] items-center gap-4 px-1 py-3.5 sm:px-3">{row}</div>}
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="activity">
          <h2 id="activity" className="mb-4 text-2xl">Recent activity</h2>
          {activity.length > 0 ? (
            <ul className="divide-y divide-border border-y border-border">
              {activity.map((a) => (
                <li key={a.key}>
                  <Link href={a.href} className="flex min-h-[4rem] items-center justify-between gap-4 px-1 py-3 transition-colors hover:bg-muted/70 sm:px-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{a.title}</span>
                      <span className="block truncate text-sm text-muted-foreground">{a.meta}</span>
                    </span>
                    <span className="num shrink-0 text-xs text-muted-foreground">{when(a.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-border px-5 py-8">
              <Clock size={20} strokeWidth={1.6} aria-hidden="true" className="text-muted-foreground" />
              <p className="mt-3 font-display text-lg font-semibold">Nothing here yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Join a study group or add a friend and it will show up here, so you can find your way back.</p>
              <Link href={`/learn/${slug}/friends`} className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-gold hover:underline">Browse {name} study groups<ArrowRight size={14} aria-hidden="true" /></Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
