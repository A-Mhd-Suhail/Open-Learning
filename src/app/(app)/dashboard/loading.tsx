import { LoadingRegion, RowListSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Mirrors the dashboard: welcome block with Student ID card, then two ruled lists. */
export default function Loading() {
  return (
    <LoadingRegion>
      <div className="space-y-14">
        <section className="flex flex-col gap-8 border-b border-border pb-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <Skeleton className="h-11 w-72 max-w-full sm:h-12" />
            <Skeleton className="h-4 w-80 max-w-full" />
            <Skeleton className="mt-3 h-12 w-40" />
          </div>
          <Skeleton className="h-40 w-full max-w-sm rounded-lg" />
        </section>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-12">
          <section><Skeleton className="mb-4 h-7 w-48" /><RowListSkeleton rows={5} /></section>
          <section><Skeleton className="mb-4 h-7 w-44" /><RowListSkeleton rows={3} /></section>
        </div>
      </div>
    </LoadingRegion>
  );
}
