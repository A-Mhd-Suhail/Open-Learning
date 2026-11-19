import type { LucideIcon } from "lucide-react";

/** One of the two things you can do inside a path: a heading block followed by a ruled list of what is inside. */
export function BranchPanel({ icon: Icon, title, description, action, children }: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <header className="band-surface bg-band p-5 text-on-band sm:p-6">
        <Icon size={24} strokeWidth={1.5} aria-hidden="true" className="text-accent" />
        <h2 className="mt-5 text-2xl sm:text-3xl">{title}</h2>
        <p className="mt-1.5 max-w-md text-sm text-band-muted">{description}</p>
        {action && <div className="mt-5">{action}</div>}
      </header>
      <div className="flex-1 px-2 sm:px-3">{children}</div>
    </section>
  );
}
