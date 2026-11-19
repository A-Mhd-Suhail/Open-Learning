import type { Metadata } from "next";
import { Globe, FolderOpen, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { RowLink, RowList } from "@/components/ui/row-link";
import { getCategory } from "@/lib/categories";
import { KIND_INFO, type Kind } from "@/lib/groups";

export const metadata: Metadata = { title: "Study groups" };

export default async function KindHome({ params }: PageProps<"/learn/[category]/friends/[kind]">) {
  const { category, kind } = await params;
  const info = getCategory(category)!, k = KIND_INFO[kind as Kind];
  const base = `/learn/${category}/friends/${kind}`;
  return (
    <>
      <PageHeader title={k.title} description={k.blurb}
        crumbs={[{ label: "Start Learning", href: "/learn" }, { label: info.name, href: `/learn/${category}` }, { label: "Learn With Friends", href: `/learn/${category}/friends` }, { label: k.title }]} />
      <RowList>
        <li><RowLink icon={Plus} title="Create Group" description="Start a public or private group and invite others." href={`${base}/create`} /></li>
        <li><RowLink icon={FolderOpen} title="Existing Groups" description="Groups you have already joined." href={`${base}/mine`} /></li>
        <li><RowLink icon={Globe} title="General Groups" description={`Open ${info.name} groups anyone can join.`} href={`${base}/general`} /></li>
      </RowList>
    </>
  );
}
