import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { RoomBrowser, RoomBrowserSkeleton } from "@/components/language/rooms/RoomBrowser";
import { isLanguageCategory } from "@/lib/categories";
import { requireLanguageProfile } from "@/lib/language/profile";

export const metadata: Metadata = { title: "Chat rooms" };

export default async function ChatRoomsPage({ params, searchParams }: PageProps<"/learn/[category]/chat">) {
  const { category } = await params;
  if (!isLanguageCategory(category)) notFound();
  await requireLanguageProfile();
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Chat rooms" description="Practise writing with other learners. Join a public room or start your own."
        crumbs={[{ label: "Learn", href: "/learn" }, { label: "Language Learning", href: "/learn/languages" }, { label: "Chat rooms" }]} />
      <Suspense fallback={<RoomBrowserSkeleton />}>
        <RoomBrowser category="languages" kind="chat" searchParams={sp} />
      </Suspense>
    </>
  );
}
