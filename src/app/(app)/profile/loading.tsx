import { LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading profile">
      <PageHeaderSkeleton crumbs={false} />
      <div className="max-w-lg space-y-5">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-4 w-24" /><Skeleton className="h-12 w-full" /><Skeleton className="h-11 w-36" />
      </div>
    </LoadingRegion>
  );
}
