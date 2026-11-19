"use client";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import type { Video } from "@/lib/videos/types";
import { allOptions, applyFilters, changeFilter, EMPTY_FILTERS, FILTER_FIELDS, hasActiveFilters, optionsFor, type FilterField, type Filters, type SortKey } from "@/lib/videos/filter";
import { VideoCard } from "@/components/app/VideoCard";
import { FILTER_LABELS, FilterFields } from "@/components/library/FilterFields";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const PAGE = 24;
const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest added" }, { key: "title", label: "Title A to Z" },
  { key: "year-desc", label: "Year, newest" }, { key: "year-asc", label: "Year, oldest" },
];
const chipLabel = (k: FilterField, v: string) => (k === "class" && /^\d+$/.test(v) ? `Class ${v}` : v);

export function VideoLibrary({ videos, examLabel, initial = EMPTY_FILTERS, initialSort = "newest" }: { videos: Video[]; examLabel: string; initial?: Filters; initialSort?: SortKey }) {
  const [f, setF] = useState<Filters>(initial);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [shown, setShown] = useState(PAGE);
  const [sheet, setSheet] = useState(false);

  // Typing stays responsive on large catalogues: input updates immediately, the filtered grid follows at low priority.
  const df = useDeferredValue(f);
  const results = useMemo(() => applyFilters(videos, df, sort), [videos, df, sort]);
  const options = useMemo(() => allOptions(videos, f), [videos, f]);
  // JEE/NEET rows all share one class value, so a Class filter would be a useless single-choice control.
  const showClass = useMemo(() => optionsFor(videos, EMPTY_FILTERS, "class").length > 1, [videos]);
  const fields = FILTER_FIELDS.filter((k) => k !== "class" || showClass);
  const active = hasActiveFilters(f);
  const activeCount = fields.filter((k) => f[k]).length;
  const set = (patch: Partial<Filters>) => { setF((p) => changeFilter(videos, p, patch)); setShown(PAGE); };
  const clear = () => { setF(EMPTY_FILTERS); setShown(PAGE); };
  const stale = df !== f;

  // Keep the URL shareable and back-safe without a navigation (replaceState only).
  useEffect(() => {
    const p = new URLSearchParams();
    for (const k of ["q", ...FILTER_FIELDS] as (keyof Filters)[]) if (f[k].trim()) p.set(k, f[k]);
    if (sort !== "newest") p.set("sort", sort);
    const qs = p.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, "", url);
  }, [f, sort]);

  if (videos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <h2 className="text-xl">No {examLabel} videos yet</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">Videos appear here as soon as the Open Learning team adds them. Check back soon.</p>
      </div>
    );
  }

  const count = results.length === videos.length
    ? `${results.length.toLocaleString("en-IN")} ${results.length === 1 ? "video" : "videos"}`
    : `${results.length.toLocaleString("en-IN")} of ${videos.length.toLocaleString("en-IN")} videos`;

  const search = (id: string) => (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">Search videos</label>
      <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input id={id} type="search" value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search title, chapter, topic…"
        className="h-11 w-full rounded-md border border-border bg-card pl-10 pr-3 text-sm" />
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
      {/* Desktop: stable filter column. Fixed width, so results never shift while filtering. */}
      <aside aria-label="Filters" className="hidden lg:block">
        <div className="sticky top-6 max-h-[calc(100dvh-3rem)] space-y-5 overflow-y-auto pr-1">
          {search("vq")}
          <FilterFields fields={fields} options={options} value={f} onChange={set} idPrefix="d" />
          {active && <Button variant="secondary" className="w-full" onClick={clear}><X size={16} aria-hidden="true" />Clear all</Button>}
        </div>
      </aside>

      <div className="min-w-0">
        {/* Mobile: sticky search + Filters sheet trigger. */}
        <div className="sticky top-16 z-20 -mx-4 flex gap-2 border-b border-border bg-background px-4 py-2.5 sm:-mx-6 sm:px-6 lg:hidden">
          {search("vq-m")}
          <button type="button" onClick={() => setSheet(true)} aria-haspopup="dialog" className="ol-pressable inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3.5 text-sm font-semibold hover:border-accent">
            <SlidersHorizontal size={16} aria-hidden="true" />Filters
            {activeCount > 0 && <span className="num inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs text-on-accent">{activeCount}</span>}
          </button>
        </div>

        <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 lg:pt-0">
          <p className="num text-sm font-medium" role="status" aria-live="polite">{count}</p>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-muted-foreground">Sort</label>
            <select id="sort" value={sort} onChange={(e) => { setSort(e.target.value as SortKey); setShown(PAGE); }} className="h-11 cursor-pointer rounded-md border border-border bg-card px-3 text-sm">
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {active && (
          <ul aria-label="Active filters" className="mb-5 flex flex-wrap items-center gap-2">
            {f.q.trim() && <li><Chip label={`“${f.q.trim()}”`} onRemove={() => set({ q: "" })} what="search" /></li>}
            {fields.filter((k) => f[k]).map((k) => <li key={k}><Chip label={chipLabel(k, f[k])} onRemove={() => set({ [k]: "" } as Partial<Filters>)} what={FILTER_LABELS[k]} /></li>)}
            <li><button type="button" onClick={clear} className="inline-flex h-11 cursor-pointer items-center px-2 text-sm font-semibold text-gold underline-offset-4 hover:underline">Clear all</button></li>
          </ul>
        )}

        {results.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card px-5 py-12 text-center">
            <SearchX className="mx-auto text-muted-foreground" size={32} strokeWidth={1.5} aria-hidden="true" />
            <h2 className="mt-3 text-lg">No videos match</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Try a different word, or remove a filter.</p>
            <Button className="mt-5" onClick={clear}>Clear all filters</Button>
          </div>
        ) : (
          <>
            <ul className={`grid gap-4 transition-opacity duration-150 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 ${stale ? "opacity-60" : ""}`}>
              {results.slice(0, shown).map((v, i) => <li key={v.id}><VideoCard video={v} priority={i < 2} /></li>)}
            </ul>
            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="num text-sm text-muted-foreground">Showing {Math.min(shown, results.length).toLocaleString("en-IN")} of {results.length.toLocaleString("en-IN")}</p>
              {results.length > shown && <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>Show more</Button>}
            </div>
          </>
        )}
      </div>

      <Dialog open={sheet} onClose={() => setSheet(false)} title="Filters" description={count}>
        <FilterFields fields={fields} options={options} value={f} onChange={set} idPrefix="m" />
        <div className="mt-6 flex gap-3">
          {active && <Button variant="secondary" className="flex-1" onClick={clear}>Clear all</Button>}
          <Button className="flex-1" onClick={() => setSheet(false)}>Show {results.length.toLocaleString("en-IN")}</Button>
        </div>
      </Dialog>
    </div>
  );
}

function Chip({ label, onRemove, what }: { label: string; onRemove: () => void; what: string }) {
  return (
    <button type="button" onClick={onRemove} aria-label={`Remove ${what} filter: ${label}`}
      className="ol-pressable inline-flex h-11 max-w-full cursor-pointer items-center gap-1.5 rounded-full border border-accent/60 bg-card pl-4 pr-3 text-sm font-medium hover:bg-muted">
      <span className="truncate">{label}</span><X size={14} aria-hidden="true" className="shrink-0" />
    </button>
  );
}
