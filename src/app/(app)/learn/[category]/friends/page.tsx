import type { Metadata } from "next";
import { Gamepad2, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { RowLink, RowList } from "@/components/ui/row-link";
import { getCategory } from "@/lib/categories";
import { KIND_INFO, KINDS } from "@/lib/groups";

export const metadata: Metadata = { title: "Learn With Friends" };

export default async function FriendsHub({ params }: PageProps<"/learn/[category]/friends">) {
  const { category } = await params;
  const info = getCategory(category)!;
  const base = `/learn/${category}/friends`;
  return (
    <>
      <PageHeader title="Learn With Friends" description={`Study ${info.name} together.`}
        crumbs={[{ label: "Learn", href: "/learn" }, { label: info.name, href: `/learn/${category}` }, { label: "Learn With Friends" }]} backHref={`/learn/${category}`} />
      <RowList>
        {KINDS.map((k) => <li key={k}><RowLink icon={KIND_INFO[k].icon} title={KIND_INFO[k].title} description={KIND_INFO[k].blurb} href={`${base}/${k}`} /></li>)}
        <li><RowLink icon={UserPlus} title="Friends" description="Find students by ID, add friends, call and study together." href={`${base}/my-friends`} /></li>
        <li><RowLink icon={Gamepad2} title="Games" description="Multiplayer learning games." href={`${base}/games`} badge="In development" /></li>
      </RowList>
    </>
  );
}
