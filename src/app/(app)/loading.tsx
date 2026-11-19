/** Shown instantly while a page's server data loads, so a tap never feels dead. */
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse motion-reduce:animate-none">
      <div className="h-4 w-40 rounded bg-muted" />
      <div className="mt-4 h-8 w-2/3 max-w-sm rounded bg-muted" />
      <div className="mt-3 h-4 w-full max-w-md rounded bg-muted" />
      <div className="mt-8 grid gap-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-lg border border-border bg-card" />)}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
