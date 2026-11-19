import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { ComingSoonPanel } from "@/components/ui/coming-soon";
import { getCategory } from "@/lib/categories";

export const metadata: Metadata = { title: "Tests" };

export default async function Page({ params }: PageProps<"/learn/[category]/self-learning/tests">) {
  const { category } = await params;
  const info = getCategory(category)!;
  const base = `/learn/${category}/self-learning`;
  return (
    <>
      <PageHeader title="Tests" backHref={base}
        crumbs={[{ label: "Learn", href: "/learn" }, { label: info.name, href: `/learn/${category}` }, { label: "Self Learning", href: base }, { label: "Tests" }]} />
      <ComingSoonPanel icon={ClipboardCheck} title="Tests" description="Timed tests and score tracking will appear here." />
      <p className="mt-6 text-sm text-muted-foreground">In the meantime, <Link href={`${base}/videos`} className="font-semibold text-foreground underline">browse the video library</Link>.</p>
    </>
  );
}
