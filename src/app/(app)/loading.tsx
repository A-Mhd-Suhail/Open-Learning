import { LoadingRegion, PageHeaderSkeleton, RowListSkeleton } from "@/components/ui/skeleton";

/** Default page-level skeleton: shown instantly inside the shell while a page's server data loads. */
export default function Loading() {
  return (
    <LoadingRegion>
      <PageHeaderSkeleton />
      <RowListSkeleton rows={4} />
    </LoadingRegion>
  );
}
