import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/components/icons";
import { cn } from "@/lib/utils";

export function CategoriesSection() {
  return (
    <section id="categories" className="scroll-mt-16 mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h2 className="max-w-xl text-3xl sm:text-4xl">Three paths are open. Two more are on the way.</h2>
      <ul className="mt-10 divide-y divide-border border-y border-border">
        {CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICONS[c.icon];
          return (
            <li key={c.slug} className={cn("grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-1 py-6 sm:grid-cols-[auto_14rem_1fr_auto]", !c.available && "text-muted-foreground")}>
              <Icon size={24} strokeWidth={1.6} aria-hidden="true" className={c.available ? "text-primary" : ""} />
              <h3 className="font-display text-2xl font-semibold text-foreground">{c.name}</h3>
              <p className="col-start-2 sm:col-start-auto">{c.tagline}</p>
              <span className={cn("col-start-2 mt-2 justify-self-start rounded border px-2.5 py-1 text-xs font-semibold sm:col-start-auto sm:mt-0", c.available ? "border-success/50 text-success" : "border-border")}>
                {c.available ? "Available now" : "Coming soon"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
