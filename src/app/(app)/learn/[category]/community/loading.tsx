import { LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading community">
      <PageHeaderSkeleton />
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div>
            <Skeleton className="mt-4 h-4 w-full" /><Skeleton className="mt-2 h-4 w-4/5" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
