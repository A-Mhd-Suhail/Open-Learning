import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { getCategory } from "@/lib/categories";
import { KIND_INFO, type Kind } from "@/lib/groups";
import { CreateGroupForm } from "./CreateGroupForm";

export const metadata: Metadata = { title: "Create group" };

export default async function Create({ params }: PageProps<"/learn/[category]/friends/[kind]/create">) {
  const { category, kind } = await params;
  const info = getCategory(category)!, k = KIND_INFO[kind as Kind];
  return (
    <>
      <PageHeader title="Create a group" description="Name it, choose who can join, then invite friends."
        crumbs={[{ label: "Learn", href: "/learn" }, { label: info.name, href: `/learn/${category}` }, { label: "Learn With Friends", href: `/learn/${category}/friends` }, { label: k.title, href: `/learn/${category}/friends/${kind}` }, { label: "Create" }]} backHref={`/learn/${category}/friends/${kind}`} />
      <CreateGroupForm category={category} kind={kind} />
    </>
  );
}
