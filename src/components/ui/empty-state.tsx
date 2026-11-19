import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-card px-5 py-10 text-center sm:py-12">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-primary">
        <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg">{title}</h2>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
