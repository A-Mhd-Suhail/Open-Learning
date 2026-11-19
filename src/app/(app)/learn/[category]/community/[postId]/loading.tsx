import { LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading post">
      <PageHeaderSkeleton />
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div>
          <Skeleton className="mt-4 h-4 w-full" /><Skeleton className="mt-2 h-4 w-4/5" /><Skeleton className="mt-4 h-48 w-full" />
        </div>
        {[0, 1].map((i) => <div key={i} className="flex gap-3"><Skeleton className="h-8 w-8 shrink-0 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-4 w-3/4" /></div></div>)}
      </div>
    </LoadingRegion>
  );
}
