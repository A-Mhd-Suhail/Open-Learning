import { Play, Search } from "lucide-react";

const FILTERS = ["Class", "Subject", "Chapter", "Topic", "Year", "Language"];
const WIDTHS = ["w-4/5", "w-2/3", "w-[72%]", "w-3/5"];

/** Layout illustration of the student video library. Bars stand in for lesson titles: nothing here pretends to be real content. */
export function LibraryPreview() {
  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-lg border border-border bg-card" role="img" aria-label="Illustration of the Open Learning video library: a search box, six filters and a list of lessons">
        <div aria-hidden="true">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <Search size={16} className="shrink-0 text-muted-foreground" />
            <span className="truncate text-sm text-muted-foreground">Search title, chapter, topic, channel…</span>
          </div>
          <div className="grid grid-cols-2 gap-2 border-b border-border bg-muted/50 p-4 sm:grid-cols-3">
            {FILTERS.map((f) => (
              <span key={f} className="flex h-9 items-center rounded-md border border-border bg-card px-3 text-xs font-semibold text-muted-foreground">{f}</span>
            ))}
          </div>
          <ul>
            {WIDTHS.map((w, i) => (
              <li key={i} className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-0">
                <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded bg-band text-accent"><Play size={14} fill="currentColor" /></span>
                <span className="min-w-0 flex-1 space-y-2">
                  <span className={`block h-3 rounded-sm bg-foreground/15 ${w}`} />
                  <span className="block h-2.5 w-2/5 rounded-sm bg-foreground/8" />
                </span>
                <span className="hidden text-xs font-semibold text-gold sm:block">Watch</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-muted-foreground">Illustration of the library layout. Lessons are added by the Open Learning team and open on YouTube.</figcaption>
    </figure>
  );
}
