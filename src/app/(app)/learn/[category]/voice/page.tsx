import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { getCategory, isLanguageCategory } from "@/lib/categories";
import { requireLanguageProfile } from "@/lib/language/profile";
import { RoomBrowser } from "@/components/language/rooms/RoomBrowser";

export const metadata: Metadata = { title: "Voice rooms" };

export default async function VoiceRoomsPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!isLanguageCategory(category)) notFound();
  await requireLanguageProfile();
  const info = getCategory(category)!;
  return (
    <>
      <PageHeader title="Voice rooms" description="Practise speaking live with other learners. Join a public room or create your own."
        crumbs={[{ label: "Learn", href: "/learn" }, { label: info.name, href: `/learn/${category}` }, { label: "Voice rooms" }]} />
      <RoomBrowser category="languages" kind="voice" />
    </>
  );
}
