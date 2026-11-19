"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getNavServerSnapshot, getNavSnapshot, previousPath, subscribeNav } from "@/components/app/NavTracker";
import { cn } from "@/lib/utils";

/**
 * Back to where the student came from when that was a page of this app, otherwise to the parent page.
 * Never loops: history is used only when the previous page differs from this one and is not a child of it.
 * Hidden on the dashboard (the root). `label` names the fallback destination, shown from sm up.
 */
export function BackButton({ fallbackHref = "/dashboard", label, className }: { fallbackHref?: string; label?: string; className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const snapshot = useSyncExternalStore(subscribeNav, getNavSnapshot, getNavServerSnapshot);
  if (pathname === "/dashboard") return null;

  const prev = previousPath(snapshot, pathname);
  const useHistory = prev !== null && !prev.startsWith(pathname + "/");
  const text = useHistory || !label ? "Back" : `Back to ${label}`;
  const cls = cn("ol-pressable group -ml-2 inline-flex h-11 min-w-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground", className);
  const inner = (
    <>
      <ArrowLeft size={18} aria-hidden="true" className="shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5 motion-reduce:transition-none" />
      <span className="sr-only sm:not-sr-only sm:max-w-[16rem] sm:truncate">{text}</span>
    </>
  );
  if (!useHistory) {
    return <Link href={fallbackHref} className={cls} aria-label={text}>{inner}</Link>;
  }
  return (
    <button type="button" onClick={() => router.back()} className={cls} aria-label={text}>{inner}</button>
  );
}
