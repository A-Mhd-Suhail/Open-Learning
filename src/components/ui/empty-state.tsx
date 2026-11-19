import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-card px-5 py-12 text-center sm:py-16">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/50 bg-muted text-gold">
        <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h2 className="t-h3 mt-5">{title}</h2>
      {description && <p className="mt-2 max-w-sm t-small text-muted-foreground">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
