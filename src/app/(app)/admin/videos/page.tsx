import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { VideoImporter } from "./VideoImporter";
import { deleteVideo } from "./actions";

export const metadata: Metadata = { title: "Videos · Admin" };
const PAGE = 25;

export default async function AdminVideos({ searchParams }: PageProps<"/admin/videos">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60).replace(/[%,()]/g, "") : "";
  let query = supabase.from("videos").select("id, video_id, exam, subject, chapter, title", { count: "exact" }).order("updated_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  if (q) query = query.or(`title.ilike.%${q}%,video_id.ilike.%${q}%,chapter.ilike.%${q}%`);
  const { data: videos, count } = await query;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  return (
    <>
      <PageHeader title="Videos" crumbs={[{ label: "Admin", href: "/admin" }, { label: "Videos" }]} />
      <div className="space-y-8">
        <VideoImporter />
        <section aria-labelledby="all">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="all" className="text-lg font-bold">All videos ({count ?? 0})</h2>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <form role="search" className="flex min-w-0 flex-1 gap-2 sm:flex-none"><label htmlFor="q" className="sr-only">Search videos</label><input id="q" name="q" defaultValue={q} placeholder="Search title, ID, chapter" className="h-11 w-full min-w-0 rounded-md border border-border bg-card px-3 text-sm sm:w-64" /></form>
              <Link href="/admin/videos/new" className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"><Plus size={16} aria-hidden="true" />Add video</Link>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground"><tr>{["Video ID", "Title", "Exam", "Subject", "Chapter", ""].map((h, i) => <th key={i} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {(videos ?? []).map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono">{v.video_id}</td><td className="px-4 py-3">{v.title}</td><td className="px-4 py-3">{v.exam}</td><td className="px-4 py-3">{v.subject}</td><td className="px-4 py-3">{v.chapter}</td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-1">
                      <Link href={`/admin/videos/${v.id}`} className="inline-flex h-11 items-center rounded-lg px-3 font-semibold hover:bg-muted">Edit</Link>
                      <form action={deleteVideo}><input type="hidden" name="id" value={v.id} /><button className="h-11 cursor-pointer rounded-lg px-3 font-semibold text-destructive hover:bg-muted" aria-label={`Delete ${v.title}`}>Delete</button></form>
                    </div></td>
                  </tr>
                ))}
                {!videos?.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No videos yet. Import a sheet or add one.</td></tr>}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
              {page > 1 ? <Link className="font-semibold hover:underline" href={`/admin/videos?page=${page - 1}${q ? `&q=${q}` : ""}`}>← Previous</Link> : <span />}
              <span className="text-muted-foreground">Page {page} of {pages}</span>
              {page < pages ? <Link className="font-semibold hover:underline" href={`/admin/videos?page=${page + 1}${q ? `&q=${q}` : ""}`}>Next →</Link> : <span />}
            </nav>
          )}
        </section>
      </div>
    </>
  );
}
