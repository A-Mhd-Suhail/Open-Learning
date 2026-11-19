"use client";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
} as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = Array.from(parts[0])[0] ?? "";
  const last = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** Round avatar: remote image when given, otherwise initials on a muted disc. Decorative next to a visible name. */
export function Avatar({ name, src, size = "md", className }: { name: string; src?: string | null; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn("relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-border bg-muted font-display font-semibold text-foreground", SIZES[size], className)}
    >
      <span aria-hidden="true">{initials(name)}</span>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote user-supplied URLs; plain img keeps the initials fallback underneath
        <img src={src} alt="" referrerPolicy="no-referrer" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      ) : null}
    </span>
  );
}
