import type { Metadata } from "next";
import { Code2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { RowLink, RowList } from "@/components/ui/row-link";
import { ComingSoonPanel } from "@/components/ui/coming-soon";
import { requireSession } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/components/icons";

export const metadata: Metadata = { title: "Choose your path" };

const EXAMS = CATEGORIES.filter((c) => ["school", "jee", "neet"].includes(c.slug));
const LANGUAGES = CATEGORIES.find((c) => c.slug === "languages")!;
const PROGRAMMING = CATEGORIES.find((c) => !c.available)!;

export default async function LearnPage() {
  const { profile } = await requireSession();
  return (
    <>
      <PageHeader title="Choose your path" description="Each path opens its own learning dashboard: a video library and study groups made for it."
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Learn" }]} />
      <div className="space-y-12 lg:space-y-14">
        <section aria-labelledby="exams">
          <h2 id="exams" className="mb-1 text-2xl">Exam preparation</h2>
          <p className="mb-4 text-sm text-muted-foreground">Video lessons by class, subject and chapter, plus study groups for your path.</p>
          <RowList>
            {EXAMS.map((c) => (
              <li key={c.slug}>
                <RowLink icon={CATEGORY_ICONS[c.icon]} title={c.name} description={c.tagline} href={`/learn/${c.slug}`} meta={c.slug === profile.category ? "Your path" : undefined} />
              </li>
            ))}
          </RowList>
        </section>

        <section aria-labelledby="skills">
          <h2 id="skills" className="mb-1 text-2xl">Skills</h2>
          <p className="mb-4 text-sm text-muted-foreground">Learn by practising with other people, or by building.</p>
          <RowList>
            <li><RowLink icon={CATEGORY_ICONS[LANGUAGES.icon]} title={LANGUAGES.name} description={LANGUAGES.tagline} href={`/learn/${LANGUAGES.slug}`} /></li>
          </RowList>
          <ComingSoonPanel className="mt-4" icon={Code2} title={PROGRAMMING.name} description={PROGRAMMING.tagline} />
        </section>
      </div>
    </>
  );
}
