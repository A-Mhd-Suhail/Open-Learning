import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small outlined gold-text pill. Never interactive: a label, not a link. */
export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-accent/60 px-2.5 py-0.5 text-xs font-semibold leading-5 text-gold", className)}>
      Coming soon
    </span>
  );
}

/** Muted, non-interactive block for a path or feature that is not built yet. */
export function ComingSoonPanel({ title, description, icon: Icon, className }: { title: string; description?: string; icon?: LucideIcon; className?: string }) {
  return (
    <div className={cn("flex items-start gap-4 rounded-lg border border-dashed border-border px-4 py-5 sm:px-5", className)}>
      {Icon && (
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground">
          <Icon size={20} strokeWidth={1.6} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h3 className="font-display text-lg font-semibold leading-snug text-muted-foreground">{title}</h3>
          <ComingSoonBadge />
        </div>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
