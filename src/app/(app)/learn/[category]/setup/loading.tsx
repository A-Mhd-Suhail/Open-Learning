import { LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Mirrors the profile form panel (shared by setup and preferences). */
export default function Loading() {
  return (
    <LoadingRegion label="Loading form">
      <PageHeaderSkeleton />
      <div className="max-w-2xl space-y-6 rounded-lg border border-border bg-card p-5 sm:p-8">
        {[0, 1, 2].map((i) => <div key={i}><Skeleton className="h-4 w-40" /><Skeleton className="mt-2 h-11 w-full" /></div>)}
        <Skeleton className="h-11 w-36" />
      </div>
    </LoadingRegion>
  );
}
