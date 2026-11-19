import { LoadingRegion, PageHeaderSkeleton, Skeleton, VideoGridSkeleton } from "@/components/ui/skeleton";

/** Mirrors the video library: exam tabs, search + filter panel, then a card grid. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading videos">
      <PageHeaderSkeleton />
      <div className="mb-5 flex gap-2"><Skeleton className="h-11 w-16" /><Skeleton className="h-11 w-16" /><Skeleton className="h-11 w-16" /></div>
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <Skeleton className="h-12 w-full" />
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      </div>
      <Skeleton className="my-5 h-5 w-28" />
      <VideoGridSkeleton count={9} />
    </LoadingRegion>
  );
}
