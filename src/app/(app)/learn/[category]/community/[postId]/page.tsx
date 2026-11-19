import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { PostDetail } from "@/components/language/community/PostDetail";
import { isLanguageCategory } from "@/lib/categories";
import { requireLanguageProfile } from "@/lib/language/profile";

export const metadata: Metadata = { title: "Post" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PostPage({ params }: PageProps<"/learn/[category]/community/[postId]">) {
  const { category, postId } = await params;
  if (!isLanguageCategory(category) || !UUID.test(postId)) notFound();
  const { supabase, user } = await requireLanguageProfile();
  return (
    <>
      <PageHeader title="Post" crumbs={[{ label: "Learn", href: "/learn" }, { label: "Language Learning", href: `/learn/${category}` }, { label: "Community", href: `/learn/${category}/community` }, { label: "Post" }]} backHref={`/learn/${category}/community`} />
      <div className="mx-auto max-w-2xl">
        {/* RLS decides visibility: a post the viewer may not see is indistinguishable from a missing one. */}
        <PostDetail supabase={supabase} postId={postId} userId={user.id} category={category} />
      </div>
    </>
  );
}
