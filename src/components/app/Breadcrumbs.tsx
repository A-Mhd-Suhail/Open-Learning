import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

/** Breadcrumb trail. Hidden below sm (the Back button covers phones). The last item is the current page. */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:block">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${i}-${c.label}`} className="inline-flex min-w-0 items-center gap-1.5">
              {c.href && !last
                ? <Link href={c.href} className="max-w-[14rem] truncate rounded-sm hover:text-foreground hover:underline">{c.label}</Link>
                : <span aria-current={last ? "page" : undefined} className={last ? "max-w-[18rem] truncate font-medium text-foreground" : "max-w-[14rem] truncate"}>{c.label}</span>}
              {!last && <ChevronRight size={14} aria-hidden="true" className="shrink-0 opacity-60" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
