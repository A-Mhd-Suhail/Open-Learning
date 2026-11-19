import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { icon?: LucideIcon; title: string; description?: string; href?: string; badge?: string; meta?: React.ReactNode };

/** A ruled list row. Live rows are links; rows without href render as disabled ("coming soon") and are not focusable. */
export function RowLink({ icon: Icon, title, description, href, badge, meta }: Props) {
  const inner = (
    <>
      {Icon && <Icon size={20} strokeWidth={1.75} aria-hidden="true" className={cn("mt-0.5 shrink-0", href ? "text-primary" : "text-muted-foreground")} />}
      <span className="min-w-0 flex-1">
        <span className={cn("block font-display text-[1.05rem] font-semibold leading-snug", !href && "text-muted-foreground")}>{title}</span>
        {description && <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>}
      </span>
      {meta && <span className="num shrink-0 text-sm text-muted-foreground">{meta}</span>}
      {badge && <span className="shrink-0 rounded border border-border px-2 py-0.5 text-xs font-semibold text-muted-foreground">{badge}</span>}
      {href && <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-foreground motion-reduce:transition-none" />}
    </>
  );
  const base = "flex items-start gap-4 px-1 py-5 sm:px-3";
  return href ? (
    <Link href={href} className={cn(base, "group transition-colors hover:bg-muted/60")}>{inner}</Link>
  ) : (
    <div className={base} aria-disabled="true">{inner}</div>
  );
}

/** Wrapper that gives a set of RowLinks their hairline rules. */
export function RowList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn("divide-y divide-border border-y border-border [&>li]:list-none", className)}>{children}</ul>;
}

/** A large choice between two or three destinations. The preview list says what is inside, so the panel is not just a title. */
export function PanelLink({ href, title, items, icon: Icon }: { href: string; title: string; items: string[]; icon: LucideIcon }) {
  return (
    <Link href={href} className="group flex h-full flex-col rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/50 sm:p-8">
      <Icon size={26} strokeWidth={1.6} aria-hidden="true" className="text-primary" />
      <h2 className="mt-8 text-2xl">{title}</h2>
      <ul className="mt-3 space-y-1 text-muted-foreground">
        {items.map((i) => <li key={i} className="flex items-center gap-2 text-sm"><span aria-hidden="true" className="h-px w-3 bg-border" />{i}</li>)}
      </ul>
      <span className="mt-8 inline-flex items-center gap-2 pt-2 text-sm font-semibold">
        Open <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
      </span>
    </Link>
  );
}
