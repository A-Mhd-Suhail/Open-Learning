import type { Metadata } from "next";
import { Brain, Swords, Timer } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { RowLink, RowList } from "@/components/ui/row-link";
import { getCategory } from "@/lib/categories";

export const metadata: Metadata = { title: "Games" };

export default async function GamesPage({ params }: PageProps<"/learn/[category]/friends/games">) {
  const { category } = await params;
  const info = getCategory(category)!;
  return (
    <>
      <PageHeader title="Games" description="Multiplayer learning games are in development. None are playable yet."
        crumbs={[{ label: "Start Learning", href: "/learn" }, { label: info.name, href: `/learn/${category}` }, { label: "Learn With Friends", href: `/learn/${category}/friends` }, { label: "Games" }]} />
      <RowList>
        <li><RowLink icon={Swords} title="Quiz Duel" description="Head-to-head quick questions with a friend." badge="In development" /></li>
        <li><RowLink icon={Timer} title="Speed Round" description="Race the clock with your study group." badge="In development" /></li>
        <li><RowLink icon={Brain} title="Concept Match" description="Match terms to definitions together." badge="Coming soon" /></li>
      </RowList>
    </>
  );
}
