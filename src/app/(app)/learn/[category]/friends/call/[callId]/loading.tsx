import { LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Connecting call">
      <PageHeaderSkeleton />
      <Skeleton className="h-64 rounded-lg" />
    </LoadingRegion>
  );
}
