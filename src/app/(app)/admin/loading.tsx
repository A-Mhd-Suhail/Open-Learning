import { LoadingRegion, PageHeaderSkeleton, RowListSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading admin">
      <PageHeaderSkeleton crumbs={false} />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
      <RowListSkeleton rows={5} />
    </LoadingRegion>
  );
}
