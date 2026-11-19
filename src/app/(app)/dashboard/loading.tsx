import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";

/** Mirrors the dashboard frame: welcome + Student ID card, quick-action block, paths and activity. */
export default function Loading() {
  return (
    <LoadingRegion label="Loading dashboard">
      <div className="space-y-12 lg:space-y-16">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-14">
          <div>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-4 h-10 w-72 max-w-full sm:h-12 lg:h-14" />
            <Skeleton className="mt-5 h-0.5 w-12" />
            <Skeleton className="mt-5 h-4 w-80 max-w-full" />
            <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Skeleton className="h-12 w-full sm:w-60" /><Skeleton className="h-12 w-full sm:w-32" /></div>
          </div>
          <Skeleton className="h-[12.5rem] w-full max-w-sm rounded-lg" />
        </section>
        <section>
          <Skeleton className="mb-4 h-8 w-40" />
          <div className="grid gap-3 md:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[4.5rem] rounded-lg" />)}</div>
        </section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-14">
          <section><Skeleton className="mb-4 h-8 w-44" /><Skeleton className="h-[22.5rem] w-full rounded-lg" /></section>
          <section><Skeleton className="mb-4 h-8 w-44" /><Skeleton className="h-[16rem] w-full rounded-lg" /></section>
        </div>
      </div>
    </LoadingRegion>
  );
}
