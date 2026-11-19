import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

export function PageHeader({ title, description, crumbs = [] }: { title: string; description?: string; crumbs?: Crumb[] }) {
  return (
    <header className="mb-6 border-b border-border pb-5 sm:mb-8 sm:pb-6">
      {crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-4">
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
      <h1 className="text-[1.75rem] leading-tight sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
    </header>
  );
}
