import { LoadingRegion, PageHeaderSkeleton, RowListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading study groups">
      <PageHeaderSkeleton />
      <RowListSkeleton rows={5} />
    </LoadingRegion>
  );
}
