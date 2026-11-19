"use client";
import { useDeferredValue, useMemo, useState } from "react";
import { Search, SearchX, X } from "lucide-react";
import type { Video } from "@/lib/videos/types";
import { allOptions, applyFilters, changeFilter, EMPTY_FILTERS, hasActiveFilters, optionsFor, type Filters, type SortKey } from "@/lib/videos/filter";
import { VideoCard } from "@/components/app/VideoCard";
import { Button } from "@/components/ui/button";

const PAGE = 24;
const SELECTS: { key: Exclude<keyof Filters, "q">; label: string }[] = [
  { key: "class", label: "Class" }, { key: "subject", label: "Subject" }, { key: "chapter", label: "Chapter" },
  { key: "topic", label: "Topic" }, { key: "year", label: "Year" }, { key: "language", label: "Language" },
];

export function VideoLibrary({ videos, examLabel }: { videos: Video[]; examLabel: string }) {
  const [f, setF] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("newest");
  const [shown, setShown] = useState(PAGE);

  // Typing stays responsive on large catalogues: input updates immediately, the filtered grid follows at low priority.
  const df = useDeferredValue(f);
  const results = useMemo(() => applyFilters(videos, df, sort), [videos, df, sort]);
  const options = useMemo(() => allOptions(videos, f), [videos, f]);
  // JEE/NEET rows all share one class value, so a Class filter would be a useless single-choice control.
  const showClass = useMemo(() => optionsFor(videos, EMPTY_FILTERS, "class").length > 1, [videos]);
  const selects = SELECTS.filter((s) => s.key !== "class" || showClass);
  const active = hasActiveFilters(f);
  const set = (patch: Partial<Filters>) => { setF((p) => changeFilter(videos, p, patch)); setShown(PAGE); };
  const clear = () => { setF(EMPTY_FILTERS); setShown(PAGE); };

  if (videos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <h2 className="text-xl font-bold">No {examLabel} videos yet</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">Videos appear here as soon as they are added by the Open Learning team. Check back soon.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <div className="relative">
          <label htmlFor="vq" className="sr-only">Search videos</label>
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input id="vq" type="search" value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search title, chapter, topic, channel…" className="h-12 w-full rounded-md border border-border bg-background pl-11 pr-4 text-sm" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
          {selects.map((s) => (
            <div key={s.key}>
              <label htmlFor={`f-${s.key}`} className="mb-1 block text-xs font-semibold text-muted-foreground">{s.label}</label>
              <select id={`f-${s.key}`} value={f[s.key]} onChange={(e) => set({ [s.key]: e.target.value } as Partial<Filters>)} className="h-11 w-full cursor-pointer rounded-md border border-border bg-background px-3 text-sm">
                <option value="">All</option>
                {options[s.key].map((o) => <option key={o} value={o}>{o}</option>)}
                {f[s.key] && !options[s.key].includes(f[s.key]) && <option value={f[s.key]}>{f[s.key]}</option>}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="my-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium" role="status" aria-live="polite">{results.length === videos.length ? `${results.length} ${results.length === 1 ? "video" : "videos"}` : `${results.length} of ${videos.length} videos`}</p>
        <div className="flex items-center gap-3">
          {active && <Button variant="ghost" size="md" onClick={clear}><X size={16} aria-hidden="true" />Clear filters</Button>}
          <label htmlFor="sort" className="sr-only">Sort by</label>
          <select id="sort" value={sort} onChange={(e) => { setSort(e.target.value as SortKey); setShown(PAGE); }} className="h-11 cursor-pointer rounded-md border border-border bg-card px-3 text-sm">
            <option value="newest">Newest added</option><option value="title">Title A–Z</option><option value="year-desc">Year: newest first</option><option value="year-asc">Year: oldest first</option>
          </select>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <SearchX className="mx-auto text-muted-foreground" size={36} aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold">No results found</h2>
          <p className="mt-1 text-muted-foreground">Try removing a filter or searching for something else.</p>
          <Button className="mt-4" onClick={clear}>Clear filters</Button>
        </div>
      ) : (
        <>
          <ul className={`ol-fade-in grid gap-x-6 gap-y-10 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${df !== f ? "opacity-60" : ""}`}>
            {results.slice(0, shown).map((v) => <li key={v.id}><VideoCard video={v} /></li>)}
          </ul>
          {results.length > shown && <div className="mt-8 text-center"><Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>Show more</Button></div>}
        </>
      )}
    </div>
  );
}
