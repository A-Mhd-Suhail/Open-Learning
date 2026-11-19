import type { Metadata } from "next";
import { ClipboardCheck, FileText, PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { RowLink, RowList } from "@/components/ui/row-link";
import { getCategory } from "@/lib/categories";

export const metadata: Metadata = { title: "Self Learning" };

export default async function SelfLearning({ params }: PageProps<"/learn/[category]/self-learning">) {
  const { category } = await params;
  const info = getCategory(category)!;
  const base = `/learn/${category}/self-learning`;
  return (
    <>
      <PageHeader title="Self Learning" description="Learn at your own pace."
        crumbs={[{ label: "Start Learning", href: "/learn" }, { label: info.name, href: `/learn/${category}` }, { label: "Self Learning" }]} />
      <RowList>
        <li><RowLink icon={PlayCircle} title="Videos" description="Browse and filter lessons by class, subject, chapter and topic." href={`${base}/videos`} /></li>
        <li><RowLink icon={FileText} title="Question Papers" description="Previous year and practice papers." href={`${base}/papers`} badge="Coming soon" /></li>
        <li><RowLink icon={ClipboardCheck} title="Tests" description="Timed tests to measure your progress." href={`${base}/tests`} badge="Coming soon" /></li>
      </RowList>
    </>
  );
}
