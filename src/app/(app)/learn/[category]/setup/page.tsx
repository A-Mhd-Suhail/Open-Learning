import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { ProfileForm } from "@/components/language/dashboard/ProfileForm";
import { isLanguageCategory } from "@/lib/categories";
import { getLanguageProfile } from "@/lib/language/profile";

export const metadata: Metadata = { title: "Set up Language Learning" };

export default async function LanguageSetup({ params, searchParams }: PageProps<"/learn/[category]/setup">) {
  const { category } = await params;
  if (!isLanguageCategory(category)) notFound();
  const sp = await searchParams;
  const profile = await getLanguageProfile();
  if (profile && sp.edit === undefined) redirect("/learn/languages");
  return (
    <>
      <PageHeader title="Set up Language Learning" description="Three quick steps, then you can join voice rooms, chat and the community."
        crumbs={[{ label: "Learn", href: "/learn" }, { label: "Language Learning", href: "/learn/languages" }, { label: "Set up" }]} backHref="/learn/languages" />
      <div className="max-w-2xl rounded-lg border border-border bg-card p-5 sm:p-8">
        <ProfileForm category={category} mode="setup" initial={profile ?? undefined} />
      </div>
    </>
  );
}
