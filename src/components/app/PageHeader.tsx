import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

/**
 * Page title block. Pages inside a section get a Back button that goes to the parent page (the previous
 * breadcrumb with a link), so it works the same on every device and after a refresh.
 */
export function PageHeader({ title, description, crumbs = [], backHref, actions }: { title: string; description?: string; crumbs?: Crumb[]; backHref?: string; actions?: React.ReactNode }) {
  const parent = [...crumbs].reverse().find((c) => c.href);
  const back = backHref ?? parent?.href;
  const backLabel = backHref ? "Back" : parent?.label ?? "Back";
  return (
    <header className="mb-8 sm:mb-10">
      {(back || crumbs.length > 0) && (
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          {back && (
            <Link href={back} className="ol-pressable group inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card pl-3 pr-4 text-sm font-semibold hover:border-accent hover:bg-muted">
              <ArrowLeft size={16} aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:transition-none" />
              <span className="max-w-[12rem] truncate">{backLabel === "Back" ? "Back" : `Back to ${backLabel}`}</span>
            </Link>
          )}
          {crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:block">
              <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                {crumbs.map((c, i) => (
                  <li key={c.label} className="inline-flex items-center gap-1">
                    {c.href ? <Link href={c.href} className="hover:text-foreground hover:underline">{c.label}</Link> : <span aria-current="page" className="font-medium text-foreground">{c.label}</span>}
                    {i < crumbs.length - 1 && <ChevronRight size={14} aria-hidden="true" />}
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[2rem] leading-[1.1] sm:text-5xl">{title}</h1>
          <div className="foil mt-5" aria-hidden="true" />
          {description && <p className="mt-4 max-w-2xl text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
    </header>
  );
}
