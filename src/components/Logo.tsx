import Link from "next/link";
import { cn } from "@/lib/utils";

/** Wordmark: an open gold "O" on a black tile. `inverse` is for black surfaces (the tile gets a gold hairline so it stays visible). */
export function Logo({ className, href = "/", inverse = false, iconOnly = false }: { className?: string; href?: string; inverse?: boolean; iconOnly?: boolean }) {
  return (
    <Link href={href} className={cn("focus-ring inline-flex shrink-0 items-center gap-2.5 rounded-md font-display font-semibold tracking-tight", inverse ? "text-on-band" : "text-foreground", className)} aria-label="Open Learning home">
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <rect width="32" height="32" rx="7" fill="#0a0a0a" />
        {inverse && <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="6.3" fill="none" stroke="#d4af37" strokeOpacity="0.55" strokeWidth="1.5" />}
        <path d="M21.5 11.2a7.2 7.2 0 1 0 0 9.6" fill="none" stroke="#d4af37" strokeWidth="2.6" strokeLinecap="round" />
        <rect x="16.5" y="19.6" width="8.5" height="3.4" rx="1" fill="#ffffff" />
      </svg>
      {!iconOnly && <span className="truncate text-[1.1rem] leading-none">Open Learning</span>}
    </Link>
  );
}
