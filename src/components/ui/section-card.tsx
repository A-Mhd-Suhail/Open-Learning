import { cn } from "@/lib/utils";

/** A flat bordered panel with a ruled header. Borders carry the structure; no shadow. */
export function SectionCard({ title, description, action, children, className }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-lg border border-border bg-card", className)}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-border px-5 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-snug">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="min-w-0 p-5 sm:p-6">{children}</div>
    </section>
  );
}
