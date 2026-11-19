import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedPost, Story } from "@/lib/language/types";
import { signedUrlsFor } from "@/lib/language/media";

/** Client-safe data loaders: take whichever Supabase client (server or browser) acts as the signed-in user. */
export type Author = { id: string; display_name: string; student_id: string; avatar_url: string | null };
export type AuthorMap = Record<string, Author>;
export const PAGE_SIZE = 10;

export async function loadAuthors(supabase: SupabaseClient, ids: string[]): Promise<AuthorMap> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return {};
  const { data } = await supabase.from("public_profiles").select("id, display_name, student_id, avatar_url").in("id", unique);
  const out: AuthorMap = {};
  for (const a of (data ?? []) as Author[]) out[a.id] = a;
  return out;
}

export type FeedPage = { posts: FeedPost[]; authors: AuthorMap; urls: Record<string, string>; hasMore: boolean; error?: string };

export async function loadFeedPage(supabase: SupabaseClient, o: { before?: string | null; language?: string | null; author?: string | null; limit?: number } = {}): Promise<FeedPage> {
  const limit = o.limit ?? PAGE_SIZE;
  const { data, error } = await supabase.rpc("community_feed", {
    p_before: o.before ?? null, p_limit: limit, p_language: o.language || null, p_author: o.author ?? null,
  });
  if (error) return { posts: [], authors: {}, urls: {}, hasMore: false, error: "Could not load posts. Please try again." };
  const posts = (data ?? []) as FeedPost[];
  const [authors, urls] = await Promise.all([
    loadAuthors(supabase, posts.map((p) => p.author_id)),
    signedUrlsFor(supabase, posts.flatMap((p) => p.images)),
  ]);
  return { posts, authors, urls, hasMore: posts.length >= limit };
}

export type StoryWithUrl = Story & { url: string | null };

export async function loadStories(supabase: SupabaseClient): Promise<{ stories: StoryWithUrl[]; authors: AuthorMap }> {
  const { data } = await supabase.from("stories").select("id, author_id, image_path, caption, created_at, expires_at")
    .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(80);
  const rows = (data ?? []) as Story[];
  const [authors, urls] = await Promise.all([loadAuthors(supabase, rows.map((s) => s.author_id)), signedUrlsFor(supabase, rows.map((s) => s.image_path))]);
  return { stories: rows.map((s) => ({ ...s, url: urls[s.image_path] ?? null })), authors };
}

const rtf = typeof Intl !== "undefined" && "RelativeTimeFormat" in Intl ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }) : null;
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(s);
  if (!rtf) return new Date(iso).toLocaleString();
  if (abs < 60) return "just now";
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (abs < 86400 * 7) return rtf.format(Math.round(s / 86400), "day");
  return new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}
export const fullDate = (iso: string) => new Date(iso).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
export function timeLeft(iso: string, now = Date.now()): string {
  const m = Math.max(0, Math.floor((new Date(iso).getTime() - now) / 60000));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m left` : `${m}m left`;
}
