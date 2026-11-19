import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { ProfileForm } from "@/components/language/dashboard/ProfileForm";
import { isLanguageCategory } from "@/lib/categories";
import { requireLanguageProfile } from "@/lib/language/profile";

export const metadata: Metadata = { title: "Language preferences" };

export default async function LanguagePreferences({ params }: PageProps<"/learn/[category]/preferences">) {
  const { category } = await params;
  if (!isLanguageCategory(category)) notFound();
  const { languageProfile: p } = await requireLanguageProfile();
  return (
    <>
      <PageHeader title="Language preferences" description="Update what you are learning and how others can find you."
        crumbs={[{ label: "Language Learning", href: "/learn/languages" }, { label: "Preferences" }]} />
      <div className="max-w-2xl rounded-lg border border-border bg-card p-5 sm:p-8">
        <ProfileForm category={category} mode="edit"
          initial={{ target_language: p.target_language, known_languages: p.known_languages, proficiency: p.proficiency, discoverable: p.discoverable }} />
      </div>
    </>
  );
}
