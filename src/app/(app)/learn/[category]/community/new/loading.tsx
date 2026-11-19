import { LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading post form">
      <PageHeaderSkeleton />
      <div className="mx-auto max-w-2xl space-y-5 rounded-lg border border-border bg-card p-5 sm:p-6">
        <Skeleton className="h-11 w-full" /><Skeleton className="h-36 w-full" /><Skeleton className="h-11 w-40" />
      </div>
    </LoadingRegion>
  );
}
