import { LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Mirrors the final library: header, exam switcher, filter column (desktop) or search bar (mobile), card grid. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading videos">
      <PageHeaderSkeleton />
      <div className="mb-6 flex gap-2"><Skeleton className="h-11 w-24" /><Skeleton className="h-11 w-16" /><Skeleton className="h-11 w-16" /></div>
      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
        <div className="hidden space-y-5 lg:block" aria-hidden="true">
          <Skeleton className="h-11 w-full" />
          {Array.from({ length: 5 }, (_, i) => <div key={i}><Skeleton className="mb-1.5 h-3 w-16" /><Skeleton className="h-11 w-full" /></div>)}
        </div>
        <div className="min-w-0">
          <div className="mb-4 flex gap-2 lg:hidden"><Skeleton className="h-11 flex-1" /><Skeleton className="h-11 w-28" /></div>
          <div className="mb-4 flex min-h-11 items-center justify-between"><Skeleton className="h-5 w-28" /><Skeleton className="h-11 w-40" /></div>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card">
                <Skeleton className="aspect-video w-full rounded-b-none" />
                <div className="p-4"><Skeleton className="h-3 w-1/2" /><Skeleton className="mt-3 h-5 w-5/6" /><Skeleton className="mt-2 h-5 w-2/3" /><Skeleton className="mt-6 h-11 w-full" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}
