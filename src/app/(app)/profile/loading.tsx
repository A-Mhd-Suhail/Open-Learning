import { LoadingRegion, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading profile">
      <PageHeaderSkeleton crumbs={false} />
      <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-12">
        <div className="space-y-6"><Skeleton className="h-[12.5rem] w-full max-w-sm rounded-lg" /><Skeleton className="h-36 w-full" /></div>
        <div className="space-y-6">
          <div className="flex items-center gap-4"><Skeleton className="h-20 w-20 rounded-full" /><Skeleton className="h-7 w-48" /></div>
          <Skeleton className="h-60 w-full rounded-lg" />
        </div>
      </div>
    </LoadingRegion>
  );
}
