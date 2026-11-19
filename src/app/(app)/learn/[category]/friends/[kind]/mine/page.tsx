import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { requireSession } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import { KIND_INFO, type Group, type Kind } from "@/lib/groups";
import { GroupList } from "../GroupList";

export const metadata: Metadata = { title: "Existing groups" };

export default async function Mine({ params }: PageProps<"/learn/[category]/friends/[kind]/mine">) {
  const { category, kind } = await params;
  const { supabase, user } = await requireSession();
  const info = getCategory(category)!, k = KIND_INFO[kind as Kind];
  const { data: memberships } = await supabase.from("group_members").select("group_id").eq("user_id", user.id);
  const ids = (memberships ?? []).map((m) => m.group_id);
  const { data } = ids.length
    ? await supabase.from("groups").select("*, group_members(count)").in("id", ids).eq("category", category).eq("type", kind).order("created_at", { ascending: false })
    : { data: [] };
  const groups = ((data ?? []) as (Group & { group_members: { count: number }[] })[]).map((g) => ({ ...g, members: g.group_members?.[0]?.count ?? 0 }));
  const base = `/learn/${category}/friends/${kind}`;
  return (
    <>
      <PageHeader title="Existing groups" crumbs={[{ label: info.name, href: `/learn/${category}` }, { label: k.title, href: base }, { label: "Existing groups" }]} />
      <GroupList groups={groups} category={category} empty={<>You have not joined any {k.title.toLowerCase()} yet. Create one or join a General group.</>} />
    </>
  );
}
