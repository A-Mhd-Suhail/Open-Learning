import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { PanelLink, RowLink, RowList } from "@/components/ui/row-link";
import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/components/icons";

export const metadata: Metadata = { title: "Choose your path" };

export default function LearnPage() {
  const exams = CATEGORIES.filter((c) => c.available && c.slug !== "languages");
  const language = CATEGORIES.find((c) => c.slug === "languages");
  const soon = CATEGORIES.filter((c) => !c.available);
  return (
    <>
      <PageHeader title="What do you want to learn?" description="Pick a path to open its learning dashboard." crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Start Learning" }]} />
      {language && (
        <section aria-labelledby="lang-h" className="mb-10">
          <h2 id="lang-h" className="mb-3 text-sm font-semibold text-muted-foreground">Community</h2>
          <PanelLink href={`/learn/${language.slug}`} title={language.name} icon={CATEGORY_ICONS[language.icon]}
            items={["Voice rooms to practise speaking", "Chat rooms by language", "Community feed and stories", "Find language friends"]} />
        </section>
      )}
      <section aria-labelledby="exam-h">
        <h2 id="exam-h" className="mb-3 text-sm font-semibold text-muted-foreground">Exam preparation</h2>
        <RowList>
          {exams.map((c) => (
            <li key={c.slug}><RowLink icon={CATEGORY_ICONS[c.icon]} title={c.name} description={c.tagline} href={`/learn/${c.slug}`} /></li>
          ))}
          {soon.map((c) => (
            <li key={c.slug}><RowLink icon={CATEGORY_ICONS[c.icon]} title={c.name} description={c.tagline} badge="Coming soon" /></li>
          ))}
        </RowList>
      </section>
    </>
  );
}
