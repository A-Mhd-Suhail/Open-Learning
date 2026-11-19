import { LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Mirrors the Friends page: search panel, then the friends list panel. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading friends">
      <PageHeaderSkeleton />
      <div className="space-y-8">
        <div className="rounded-lg border border-border bg-card p-5"><Skeleton className="h-5 w-32" /><div className="mt-3 flex gap-2"><Skeleton className="h-11 w-full max-w-md" /><Skeleton className="h-11 w-24" /></div></div>
        <div className="rounded-lg border border-border bg-card p-5">
          <Skeleton className="h-5 w-40" />
          {[0, 1, 2].map((i) => <div key={i} className="mt-4 flex items-center justify-between gap-3"><Skeleton className="h-5 w-48" /><Skeleton className="h-11 w-24" /></div>)}
        </div>
      </div>
    </LoadingRegion>
  );
}
