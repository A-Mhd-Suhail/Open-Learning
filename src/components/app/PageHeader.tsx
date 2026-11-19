import { BackButton } from "@/components/app/BackButton";
import { Breadcrumbs, type Crumb } from "@/components/app/Breadcrumbs";

export type { Crumb };

/**
 * Page title block: chrome row (Back + breadcrumb), optional eyebrow, h1, description, actions.
 * Back goes to the previous in-app page, else to `backHref`, else the last crumb with a link, else /dashboard.
 */
export function PageHeader({ title, description, crumbs = [], backHref, actions, eyebrow }: { title: string; description?: string; crumbs?: Crumb[]; backHref?: string; actions?: React.ReactNode; eyebrow?: string }) {
  const parent = [...crumbs].reverse().find((c) => c.href);
  const fallback = backHref ?? parent?.href ?? "/dashboard";
  const label = backHref ? undefined : parent?.label;
  return (
    <header className="mb-8 sm:mb-10 lg:mb-12">
      <div className="mb-5 flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1 sm:mb-6">
        <BackButton fallbackHref={fallback} label={label} />
        <Breadcrumbs crumbs={crumbs} />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          {eyebrow && <p className="t-eyebrow mb-3">{eyebrow}</p>}
          <h1 className="t-h1">{title}</h1>
          <div className="foil mt-5" aria-hidden="true" />
          {description && <p className="t-body t-measure mt-4 text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
