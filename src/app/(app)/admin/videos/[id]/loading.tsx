import { LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading form">
      <PageHeaderSkeleton />
      <div className="max-w-2xl space-y-5 rounded-lg border border-border bg-card p-5 sm:p-6">
        {[0, 1, 2, 3].map((i) => <div key={i}><Skeleton className="h-4 w-28" /><Skeleton className="mt-2 h-11 w-full" /></div>)}
        <Skeleton className="h-11 w-36" />
      </div>
    </LoadingRegion>
  );
}
