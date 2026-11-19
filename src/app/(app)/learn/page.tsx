import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { RowLink, RowList } from "@/components/ui/row-link";
import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/components/icons";

export const metadata: Metadata = { title: "Choose your path" };

/** Every path, School to Language Learning, is the same kind of row: one list, one pattern. */
export default function LearnPage() {
  return (
    <>
      <PageHeader title="What do you want to learn?" description="Pick a path to open its learning dashboard."
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Learn" }]} />
      <RowList>
        {CATEGORIES.map((c) => (
          <li key={c.slug}>
            <RowLink icon={CATEGORY_ICONS[c.icon]} title={c.name} description={c.tagline}
              href={c.available ? `/learn/${c.slug}` : undefined} badge={c.available ? undefined : "Coming soon"} />
          </li>
        ))}
      </RowList>
    </>
  );
}
