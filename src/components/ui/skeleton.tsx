import { cn } from "@/lib/utils";

/** Loading placeholder. Pulses only when the user has not asked for reduced motion. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("rounded-md bg-muted motion-safe:animate-pulse", className)} />;
}
