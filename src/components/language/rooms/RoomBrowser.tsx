import Link from "next/link";
import { MessageCircle, Mic } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { isLanguageCategory } from "@/lib/categories";
import { ALL_LANGUAGES, isLanguageLabel } from "@/lib/language/languages";
import type { LanguageRoom } from "@/lib/language/types";
import { cn } from "@/lib/utils";
import { CreateRoomForm } from "./CreateRoomForm";
import { RoomCard } from "./RoomCard";

type SP = Record<string, string | string[] | undefined>;

export function RoomBrowserSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading rooms" role="status">
      <div className="mb-6 h-11 w-full max-w-xs animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
      <ul className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <li key={i} className="h-40 animate-pulse rounded-lg border border-border bg-muted motion-reduce:animate-none" />)}
      </ul>
    </div>
  );
}

/** Lists public language rooms (and rooms I belong to) with a server-side language filter and a Create Room dialog. */
export async function RoomBrowser({ category, kind, searchParams }: { category: string; kind: "chat" | "voice"; searchParams?: SP }) {
  if (!isLanguageCategory(category)) return null;
  const { supabase, user } = await requireSession();
  const rawLang = searchParams?.lang;
  const lang = typeof rawLang === "string" && isLanguageLabel(rawLang) ? rawLang.trim() : null;
  const joinFailed = searchParams?.error === "join";

  const { data, error } = await supabase.rpc("language_rooms", { p_type: kind, p_language: lang });
  const rooms = (data ?? []) as LanguageRoom[];
  const base = `/learn/languages/${kind}`;
  const label = kind === "voice" ? "voice" : "chat";
  const Icon = kind === "voice" ? Mic : MessageCircle;
  // Chips: common languages, plus the active one if it is a custom label.
  const chips = lang && !ALL_LANGUAGES.includes(lang) ? [...ALL_LANGUAGES, lang] : ALL_LANGUAGES;
  const chip = "inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors motion-reduce:transition-none";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Icon size={16} aria-hidden="true" />
          <span className="num">{rooms.length}</span> {label} room{rooms.length === 1 ? "" : "s"}{lang ? <> in <strong className="text-foreground">{lang}</strong></> : null}
        </p>
        <CreateRoomForm category="languages" kind={kind} defaultLanguage={lang ?? ""} />
      </div>

      <nav aria-label="Filter by language" className="-mx-4 mb-6 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <ul className="flex gap-2 sm:flex-wrap">
          <li><Link href={base} scroll={false} aria-current={lang ? undefined : "page"}
            className={cn(chip, !lang ? "border-primary bg-primary text-on-primary" : "border-border bg-card hover:bg-muted")}>All languages</Link></li>
          {chips.map((l) => (
            <li key={l}><Link href={`${base}?lang=${encodeURIComponent(l)}`} scroll={false} aria-current={lang === l ? "page" : undefined}
              className={cn(chip, lang === l ? "border-primary bg-primary text-on-primary" : "border-border bg-card hover:bg-muted")}>{l}</Link></li>
          ))}
        </ul>
      </nav>

      {joinFailed && <p role="alert" className="mb-4 rounded-md border border-destructive/40 bg-card p-3 text-sm text-destructive">Could not join that room. It may be private or no longer available.</p>}
      {error ? (
        <p role="alert" className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">Rooms could not be loaded. Refresh to try again.</p>
      ) : rooms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center sm:p-12">
          <Icon className="mx-auto text-muted-foreground" size={28} aria-hidden="true" />
          <h2 className="mt-3 text-lg">{lang ? `No ${lang} ${label} rooms yet` : `No ${label} rooms yet`}</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Be the first to start one and invite other learners.</p>
          <div className="mt-5 flex justify-center"><CreateRoomForm category="languages" kind={kind} defaultLanguage={lang ?? ""} /></div>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rooms.map((r) => <li key={r.id} className="min-w-0"><RoomCard room={r} category="languages" isOwn={r.created_by === user.id} /></li>)}
        </ul>
      )}
    </div>
  );
}
