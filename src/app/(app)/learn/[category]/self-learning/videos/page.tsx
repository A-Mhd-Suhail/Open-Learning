import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/PageHeader";
import { requireSession } from "@/lib/auth";
import { ACTIVE_CATEGORIES, getCategory } from "@/lib/categories";
import { CATEGORY_TO_EXAM } from "@/lib/videos/types";
import { loadAllVideos } from "@/lib/videos/load";
import { VideoLibrary } from "./VideoLibrary";

export const metadata: Metadata = { title: "Videos" };

export default async function VideosPage({ params }: PageProps<"/learn/[category]/self-learning/videos">) {
  const { category } = await params;
  const info = getCategory(category)!;
  const { supabase } = await requireSession();
  const exam = CATEGORY_TO_EXAM[category];
  const { videos, error } = await loadAllVideos(supabase, exam);
  return (
    <>
      <PageHeader title="Video library" description={`${info.name} lessons from the Open Learning library.`}
        crumbs={[{ label: "Start Learning", href: "/learn" }, { label: info.name, href: `/learn/${category}` }, { label: "Self Learning", href: `/learn/${category}/self-learning` }, { label: "Videos" }]} />
      <nav aria-label="Exam" className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground">Exam</span>
        {ACTIVE_CATEGORIES.map((c) => (
          <Link key={c} href={`/learn/${c}/self-learning/videos`} aria-current={c === category ? "page" : undefined}
            className={`inline-flex h-11 items-center rounded-md px-4 text-sm font-semibold ${c === category ? "bg-primary text-on-primary" : "border border-border bg-card hover:bg-muted"}`}>{CATEGORY_TO_EXAM[c]}</Link>
        ))}
      </nav>
      {error ? <p role="alert" className="rounded-md border border-destructive/40 p-4 text-destructive">Could not load videos. Please refresh.</p>
        : <VideoLibrary videos={videos} examLabel={exam} />}
    </>
  );
}
