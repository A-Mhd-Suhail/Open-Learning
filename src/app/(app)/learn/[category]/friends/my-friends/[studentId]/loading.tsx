import { LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading student">
      <PageHeaderSkeleton />
      <div className="max-w-xl space-y-4 rounded-lg border border-border bg-card p-6">
        {[0, 1, 2].map((i) => <div key={i} className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" /></div>)}
        <Skeleton className="h-11 w-48" />
      </div>
    </LoadingRegion>
  );
}
