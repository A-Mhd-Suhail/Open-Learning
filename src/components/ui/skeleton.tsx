import { cn } from "@/lib/utils";

/** Loading placeholder: flat shimmer, switched off under prefers-reduced-motion. Give it the final size to avoid layout shift. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("ol-skeleton rounded-md", className)} />;
}

/** Page header placeholder matching PageHeader's spacing. */
export function PageHeaderSkeleton({ crumbs = true }: { crumbs?: boolean }) {
  return (
    <div className="mb-6 border-b border-border pb-5 sm:mb-8 sm:pb-6">
      {crumbs && <Skeleton className="mb-4 h-4 w-48" />}
      <Skeleton className="h-9 w-2/3 max-w-sm sm:h-10" />
      <Skeleton className="mt-3 h-4 w-full max-w-md" />
    </div>
  );
}

/** Ruled-row list placeholder (RowList look). */
export function RowListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border border-y border-border" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-start gap-4 px-1 py-5 sm:px-3">
          <Skeleton className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-3/4" /></div>
        </div>
      ))}
    </div>
  );
}

/** Video card grid placeholder. */
export function VideoGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="mt-3 h-3 w-1/3" />
          <Skeleton className="mt-2 h-5 w-5/6" />
          <Skeleton className="mt-3 h-9 w-24" />
        </div>
      ))}
    </div>
  );
}

/** Wrapper that announces loading once and fades real content in. */
export function LoadingRegion({ children, label = "Loading" }: { children: React.ReactNode; label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      {children}
      <span className="sr-only">{label}…</span>
    </div>
  );
}
