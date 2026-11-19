import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Feed } from "@/components/language/community/Feed";
import { StoriesStrip } from "@/components/language/community/StoriesStrip";
import { loadFeedPage, loadStories } from "@/components/language/community/data";
import { isLanguageCategory } from "@/lib/categories";
import { requireLanguageProfile } from "@/lib/language/profile";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityPage({ params }: PageProps<"/learn/[category]/community">) {
  const { category } = await params;
  if (!isLanguageCategory(category)) notFound();
  const { supabase, user } = await requireLanguageProfile();
  const [page, st] = await Promise.all([loadFeedPage(supabase), loadStories(supabase)]);
  return (
    <>
      <PageHeader title="Community" description="Share what you are learning, see what others post, and add stories that disappear after 24 hours."
        crumbs={[{ label: "Start Learning", href: "/learn" }, { label: "Languages", href: `/learn/${category}` }, { label: "Community" }]} />
      <div className="mx-auto max-w-2xl space-y-5">
        <Link href={`/learn/${category}/community/new`} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-base font-semibold text-on-primary transition-colors hover:bg-primary-hover sm:w-auto">
          <Plus size={20} aria-hidden="true" /> Create post
        </Link>
        <StoriesStrip category={category} userId={user.id} stories={st.stories} authors={st.authors} />
        <Feed category={category} userId={user.id} initialPosts={page.posts} initialAuthors={page.authors} initialUrls={page.urls}
          initialHasMore={page.hasMore} initialLanguage="" initialError={page.error} />
      </div>
    </>
  );
}
