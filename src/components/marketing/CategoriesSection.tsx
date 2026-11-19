import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/components/icons";
import { SectionHead } from "./SectionHead";

/** Learning paths, straight from the category data so the list never goes stale. */
export function CategoriesSection() {
  const live = CATEGORIES.filter((c) => c.available);
  const soon = CATEGORIES.filter((c) => !c.available);
  return (
    <section id="paths" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHead eyebrow="Learning paths" title="Pick the path you are on">
          Each path has its own space, so School students meet School students and JEE meets JEE. Sign in to open one.
        </SectionHead>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {live.map((c) => {
            const Icon = CATEGORY_ICONS[c.icon];
            return (
              <li key={c.slug}>
                <Link href={`/learn/${c.slug}`} className="group flex h-full min-h-32 items-start gap-4 rounded-lg border border-border bg-card p-5 transition-colors duration-150 hover:border-accent sm:p-6">
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-band text-accent"><Icon size={20} strokeWidth={1.6} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-display text-xl font-semibold">{c.name}</span>
                      <ArrowUpRight size={18} aria-hidden="true" className="shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold" />
                    </span>
                    <span className="mt-1 block text-[0.95rem] leading-relaxed text-muted-foreground">{c.tagline}</span>
                    <span className="mt-3 inline-block text-xs font-semibold uppercase tracking-[0.12em] text-gold">Available now</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {soon.map((c) => {
          const Icon = CATEGORY_ICONS[c.icon];
          return (
            <div key={c.slug} className="mt-4 flex items-center gap-4 rounded-lg border border-dashed border-border p-5 text-muted-foreground sm:p-6">
              <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border"><Icon size={20} strokeWidth={1.6} /></span>
              <p className="min-w-0 flex-1 text-[0.95rem]"><span className="font-display text-lg font-semibold">{c.name}</span><span className="hidden sm:inline"> · {c.tagline}</span></p>
              <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-semibold">Coming soon</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
