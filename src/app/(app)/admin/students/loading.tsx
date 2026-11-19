import { LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Mirrors an admin table page: header, toolbar, bordered table. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading table">
      <PageHeaderSkeleton />
      <Skeleton className="mb-4 h-11 w-full sm:max-w-sm" />
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="flex items-center gap-4 px-4 py-4"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-4 w-1/3" /><Skeleton className="hidden h-4 w-1/5 sm:block" /></div>)}
      </div>
    </LoadingRegion>
  );
}
