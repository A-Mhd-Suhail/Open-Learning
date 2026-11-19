import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/components/icons";
import { RowLink, RowList } from "@/components/ui/row-link";

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five"];

/** Every path is the same row, Language Learning included. The count comes from the data, so it never goes stale. */
export function CategoriesSection() {
  const live = CATEGORIES.filter((c) => c.available).length;
  const soon = CATEGORIES.length - live;
  return (
    <section id="paths" className="scroll-mt-16 border-t border-border bg-muted/50">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h2 className="max-w-xl text-4xl sm:text-5xl">{WORDS[live]} paths are open.{soon > 0 ? ` ${WORDS[soon]} more ${soon === 1 ? "is" : "are"} on the way.` : ""}</h2>
        <div className="foil mt-6" aria-hidden="true" />
        <div className="mt-12">
          <RowList>
            {CATEGORIES.map((c) => (
              <li key={c.slug}><RowLink icon={CATEGORY_ICONS[c.icon]} title={c.name} description={c.tagline} badge={c.available ? "Available now" : "Coming soon"} /></li>
            ))}
          </RowList>
        </div>
      </div>
    </section>
  );
}
