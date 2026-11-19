import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { ComingSoonPanel } from "@/components/ui/coming-soon";
import { getCategory } from "@/lib/categories";

export const metadata: Metadata = { title: "Question Papers" };

export default async function Page({ params }: PageProps<"/learn/[category]/self-learning/papers">) {
  const { category } = await params;
  const info = getCategory(category)!;
  const base = `/learn/${category}/self-learning`;
  return (
    <>
      <PageHeader title="Question Papers" backHref={base}
        crumbs={[{ label: "Learn", href: "/learn" }, { label: info.name, href: `/learn/${category}` }, { label: "Self Learning", href: base }, { label: "Question Papers" }]} />
      <ComingSoonPanel icon={FileText} title="Question Papers" description="Previous year papers and practice sets will appear here." />
      <p className="mt-6 text-sm text-muted-foreground">In the meantime, <Link href={`${base}/videos`} className="font-semibold text-foreground underline">browse the video library</Link>.</p>
    </>
  );
}
