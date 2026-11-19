import { LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

/** The invite page joins the group and redirects; show the destination's frame while that happens. */
export default function Loading() {
  return (
    <LoadingRegion label="Joining group">
      <PageHeaderSkeleton />
      <div className="max-w-xl rounded-lg border border-border bg-card p-6"><Skeleton className="h-5 w-48" /><Skeleton className="mt-3 h-4 w-72 max-w-full" /></div>
    </LoadingRegion>
  );
}
