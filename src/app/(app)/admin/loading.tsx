import { LoadingRegion, PageHeaderSkeleton, RowListSkeleton } from "@/components/ui/skeleton";

/** Mirrors the admin hub (header + three ruled rows). Sub-pages have their own table skeletons. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading admin">
      <PageHeaderSkeleton />
      <RowListSkeleton rows={3} />
    </LoadingRegion>
  );
}
