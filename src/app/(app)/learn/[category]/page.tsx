import type { Metadata } from "next";
import { BookOpen, Users } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { LanguageDashboard } from "@/components/language/dashboard/LanguageDashboard";
import { PanelLink } from "@/components/ui/row-link";
import { getCategory, isLanguageCategory } from "@/lib/categories";

export const metadata: Metadata = { title: "Learning dashboard" };

export default async function CategoryDashboard({ params }: PageProps<"/learn/[category]">) {
  const { category } = await params;
  if (isLanguageCategory(category)) return <LanguageDashboard />;
  const info = getCategory(category)!;
  return (
    <>
      <PageHeader title={`${info.name} learning`} description={info.tagline}
        crumbs={[{ label: "Start Learning", href: "/learn" }, { label: info.name }]} />
      <div className="grid gap-5 md:grid-cols-2">
        <PanelLink icon={BookOpen} title="Self Learning" href={`/learn/${category}/self-learning`} items={["Videos", "Question papers", "Tests"]} />
        <PanelLink icon={Users} title="Learn With Friends" href={`/learn/${category}/friends`} items={["Group discussion, chat and voice", "Friends", "Games"]} />
      </div>
    </>
  );
}
