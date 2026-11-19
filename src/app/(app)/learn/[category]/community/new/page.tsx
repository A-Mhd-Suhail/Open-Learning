import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { CreatePostForm } from "@/components/language/community/CreatePostForm";
import { isLanguageCategory } from "@/lib/categories";
import { requireLanguageProfile } from "@/lib/language/profile";

export const metadata: Metadata = { title: "Create post" };

export default async function NewPostPage({ params }: PageProps<"/learn/[category]/community/new">) {
  const { category } = await params;
  if (!isLanguageCategory(category)) notFound();
  const { user, languageProfile } = await requireLanguageProfile();
  return (
    <>
      <PageHeader title="Create post" description="Share text and up to 6 images with the Language Learning community."
        crumbs={[{ label: "Learn", href: "/learn" }, { label: "Languages", href: `/learn/${category}` }, { label: "Community", href: `/learn/${category}/community` }, { label: "Create post" }]} />
      <div className="mx-auto max-w-2xl">
        <CreatePostForm category={category} userId={user.id} defaultLanguage={languageProfile.target_language} />
      </div>
    </>
  );
}
