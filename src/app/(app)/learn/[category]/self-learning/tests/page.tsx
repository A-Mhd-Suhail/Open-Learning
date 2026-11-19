import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { ButtonLink } from "@/components/ui/button";
import { getCategory } from "@/lib/categories";

export const metadata: Metadata = { title: "Tests" };

export default async function Page({ params }: PageProps<"/learn/[category]/self-learning/tests">) {
  const { category } = await params;
  const info = getCategory(category)!;
  return (
    <>
      <PageHeader title="Tests"
        crumbs={[{ label: "Learn", href: "/learn" }, { label: info.name, href: `/learn/${category}` }, { label: "Self Learning", href: `/learn/${category}/self-learning` }, { label: "Tests" }]} />
      <div className="rounded-lg border border-dashed border-border p-10 text-center sm:p-16">
        <ClipboardCheck className="mx-auto text-muted-foreground" size={32} strokeWidth={1.5} aria-hidden="true" />
        <h2 className="mt-4 font-display text-2xl font-semibold">Coming soon</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">Timed tests and score tracking will appear here.</p>
        <ButtonLink href={`/learn/${category}/self-learning/videos`} className="mt-6">Browse videos meanwhile</ButtonLink>
      </div>
    </>
  );
}
