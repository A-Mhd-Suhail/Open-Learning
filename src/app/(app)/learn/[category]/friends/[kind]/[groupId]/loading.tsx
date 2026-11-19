import { LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Mirrors a group page: conversation panel plus the 280px members rail. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading group">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Skeleton className="h-[28rem] rounded-lg" />
        <div className="space-y-5"><Skeleton className="h-48 rounded-lg" /><Skeleton className="h-11 w-full" /></div>
      </div>
    </LoadingRegion>
  );
}
