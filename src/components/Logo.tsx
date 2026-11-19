import Link from "next/link";
import { cn } from "@/lib/utils";

/** Wordmark: an open "O" (open learning) with a highlighter bar. `inverse` is for the navy band. */
export function Logo({ className, href = "/", inverse = false }: { className?: string; href?: string; inverse?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-display font-semibold tracking-tight", inverse ? "text-on-band" : "text-foreground", className)} aria-label="Open Learning home">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill={inverse ? "#f2f6fa" : "var(--primary)"} />
        <path d="M21.5 11.2a7.2 7.2 0 1 0 0 9.6" fill="none" stroke={inverse ? "#0b2a4a" : "var(--on-primary)"} strokeWidth="2.6" strokeLinecap="round" />
        <rect x="16.5" y="19.6" width="8.5" height="3.4" rx="1" fill="var(--accent)" />
      </svg>
      <span className="text-[1.05rem]">Open Learning</span>
    </Link>
  );
}
