import { Play, Search } from "lucide-react";

/** A faithful, static preview of the student video library (sample rows, labelled as such). It shows the product doing its job. */
const ROWS = [
  { t: "Rotational motion: torque and angular momentum", s: "Physics", c: "Class 11", e: "JEE" },
  { t: "Photosynthesis in higher plants", s: "Biology", c: "Class 11", e: "NEET" },
  { t: "Quadratic equations: nature of roots", s: "Maths", c: "Class 10", e: "School" },
  { t: "Chemical bonding and hybridisation", s: "Chemistry", c: "Class 11", e: "JEE" },
  { t: "Light: reflection and refraction", s: "Science", c: "Class 10", e: "School" },
];

export function LibraryPreview() {
  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-xl border border-white/15 bg-card" role="img" aria-label="Preview of the Open Learning video library with search, filters and lesson rows">
        <div aria-hidden="true">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Search size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Search title, chapter, topic</span>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold">
            {["Class 11", "Physics", "All chapters", "English"].map((f, i) => (
              <span key={f} className={i < 2 ? "rounded-full border border-accent bg-accent/10 px-3 py-1 text-accent" : "rounded-full border border-border px-3 py-1 text-muted-foreground"}>{f}</span>
            ))}
          </div>
          <ul>
            {ROWS.map((r, i) => (
              <li key={r.t} style={{ "--i": i + 2 } as React.CSSProperties} className="rise flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0">
                <span className="flex h-9 w-14 shrink-0 items-center justify-center rounded bg-muted text-accent"><Play size={14} fill="currentColor" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{r.t}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{r.s} · {r.c} · {r.e}</span>
                </span>
                <span className="hidden text-xs font-semibold text-accent sm:block">Watch</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-band-muted">Sample lessons shown for illustration. Your library is filled by the Open Learning team.</figcaption>
    </figure>
  );
}
