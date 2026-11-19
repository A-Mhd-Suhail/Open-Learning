import type { SupabaseClient } from "@supabase/supabase-js";
import type { Exam, Video } from "./types";

/** PostgREST caps a response at 1000 rows by default, so `.limit(5000)` silently truncates: page with .range(). */
export const PAGE_SIZE = 1000;
const COLUMNS = "id, video_id, exam, class, subject, chapter, topic, year, title, youtube_url, thumbnail_url, description, language, created_at";

type Page = { data: Video[] | null; error: { message: string } | null; count?: number | null };

/** Loads every video for an exam. Stable order (created_at desc, id) so pages never overlap or skip rows. */
export async function loadAllVideos(supabase: SupabaseClient, exam: Exam): Promise<{ videos: Video[]; error: string | null }> {
  const page = (from: number, withCount: boolean) =>
    supabase.from("videos").select(COLUMNS, withCount ? { count: "exact" } : undefined).eq("exam", exam)
      .order("created_at", { ascending: false }).order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1) as unknown as PromiseLike<Page>;
  const first = await page(0, true);
  if (first.error) return { videos: [], error: first.error.message };
  const rows = first.data ?? [];
  const total = first.count ?? rows.length;
  if (rows.length < PAGE_SIZE || total <= PAGE_SIZE) return { videos: rows, error: null };
  const starts: number[] = [];
  for (let s = PAGE_SIZE; s < total; s += PAGE_SIZE) starts.push(s);
  const rest = await Promise.all(starts.map((s) => page(s, false)));
  for (const r of rest) {
    if (r.error) return { videos: [], error: r.error.message };
    rows.push(...(r.data ?? []));
  }
  return { videos: rows, error: null };
}
