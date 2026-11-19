import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { icon?: LucideIcon; title: string; description?: string; href?: string; badge?: string; meta?: React.ReactNode };

/** A ruled list row. Live rows are links; rows without href render as disabled ("coming soon") and are not focusable. */
export function RowLink({ icon: Icon, title, description, href, badge, meta }: Props) {
  const inner = (
    <>
      {Icon && (
        <span aria-hidden="true" className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200",
          href ? "border-transparent bg-band text-accent group-hover:border-accent" : "border-border text-muted-foreground")}>
          <Icon size={20} strokeWidth={1.6} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={cn("block font-display text-xl font-semibold leading-snug", !href && "text-muted-foreground")}>{title}</span>
        {description && <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>}
      </span>
      {meta && <span className="num shrink-0 text-sm text-muted-foreground">{meta}</span>}
      {badge && <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">{badge}</span>}
      {href && (
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-200 group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent">
          <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
        </span>
      )}
    </>
  );
  const base = "flex items-center gap-4 px-2 py-5 sm:gap-5 sm:px-4";
  return href ? (
    <Link href={href} className={cn(base, "group transition-colors hover:bg-muted/70")}>{inner}</Link>
  ) : (
    <div className={base} aria-disabled="true">{inner}</div>
  );
}

/** Wrapper that gives a set of RowLinks their hairline rules. */
export function RowList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn("divide-y divide-border border-y border-border [&>li]:list-none", className)}>{children}</ul>;
}

/** A large choice between two or three destinations: a black panel that says what is inside. */
export function PanelLink({ href, title, items, icon: Icon }: { href: string; title: string; items: string[]; icon: LucideIcon }) {
  return (
    <Link href={href} className="band-surface group flex h-full flex-col rounded-xl border border-transparent bg-band p-6 text-on-band transition-colors duration-200 hover:border-accent sm:p-8">
      <Icon size={26} strokeWidth={1.5} aria-hidden="true" className="text-accent" />
      <h2 className="mt-10 text-3xl">{title}</h2>
      <ul className="mt-4 space-y-1.5 text-band-muted">
        {items.map((i) => <li key={i} className="flex items-center gap-3 text-sm"><span aria-hidden="true" className="h-px w-4 bg-accent" />{i}</li>)}
      </ul>
      <span className="mt-8 inline-flex items-center gap-2 pt-2 text-sm font-semibold text-accent">
        Open <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
      </span>
    </Link>
  );
}
