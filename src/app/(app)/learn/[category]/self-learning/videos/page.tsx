import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/PageHeader";
import { requireSession } from "@/lib/auth";
import { ACTIVE_CATEGORIES, getCategory } from "@/lib/categories";
import { CATEGORY_TO_EXAM } from "@/lib/videos/types";
import { loadVideosCached } from "@/lib/videos/cached";
import { EMPTY_FILTERS, FILTER_FIELDS, reconcileFilters, type Filters, type SortKey } from "@/lib/videos/filter";
import { VideoLibrary } from "./VideoLibrary";

export const metadata: Metadata = { title: "Video library" };

const SORT_KEYS: SortKey[] = ["newest", "title", "year-desc", "year-asc"];

export default async function VideosPage({ params, searchParams }: PageProps<"/learn/[category]/self-learning/videos">) {
  const { category } = await params;
  const sp = await searchParams;
  const info = getCategory(category)!;
  await requireSession(); // auth gate first; the catalogue itself is shared, cached data
  const exam = CATEGORY_TO_EXAM[category];
  const { videos, error } = await loadVideosCached(exam);

  // Restore shared/refreshed state from the URL; reconcile drops values that no longer exist in this catalogue.
  const one = (k: string) => { const v = sp[k]; return (Array.isArray(v) ? v[0] : v) ?? ""; };
  const parsed: Filters = { ...EMPTY_FILTERS, q: one("q").slice(0, 200) };
  for (const k of FILTER_FIELDS) parsed[k] = one(k).slice(0, 200);
  const initial = reconcileFilters(videos, parsed);
  const sortParam = one("sort") as SortKey;
  const initialSort: SortKey = SORT_KEYS.includes(sortParam) ? sortParam : "newest";

  return (
    <>
      <PageHeader title="Video library" description={`${info.name} lessons from the Open Learning library. Every video opens on YouTube in a new tab.`}
        backHref={`/learn/${category}/self-learning`}
        crumbs={[{ label: "Learn", href: "/learn" }, { label: info.name, href: `/learn/${category}` }, { label: "Self Learning", href: `/learn/${category}/self-learning` }, { label: "Videos" }]} />
      <nav aria-label="Exam" className="mb-6 flex flex-wrap items-center gap-2">
        {ACTIVE_CATEGORIES.map((c) => (
          <Link key={c} href={`/learn/${c}/self-learning/videos`} aria-current={c === category ? "page" : undefined}
            className={`inline-flex h-11 min-w-16 items-center justify-center rounded-md border px-5 text-sm font-semibold transition-colors duration-150 ${c === category ? "border-primary bg-primary text-on-primary" : "border-border bg-card hover:border-accent hover:bg-muted"}`}>{CATEGORY_TO_EXAM[c]}</Link>
        ))}
      </nav>
      {error ? (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-card p-6">
          <h2 className="text-lg">Could not load videos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Something went wrong on our side. Refresh the page to try again.</p>
        </div>
      ) : <VideoLibrary key={category} videos={videos} examLabel={exam} initial={initial} initialSort={initialSort} />}
    </>
  );
}
