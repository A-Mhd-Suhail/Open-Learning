import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { requireSession } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import { KIND_INFO, type Group, type Kind } from "@/lib/groups";
import { GroupList } from "../GroupList";

export const metadata: Metadata = { title: "General groups" };

export default async function General({ params }: PageProps<"/learn/[category]/friends/[kind]/general">) {
  const { category, kind } = await params;
  const { supabase, user } = await requireSession();
  const info = getCategory(category)!, k = KIND_INFO[kind as Kind];
  const [{ data: groups }, { data: mine }] = await Promise.all([
    supabase.from("groups").select("*").eq("is_general", true).eq("category", category).eq("type", kind).order("slug"),
    supabase.from("group_members").select("group_id").eq("user_id", user.id),
  ]);
  const base = `/learn/${category}/friends/${kind}`;
  return (
    <>
      <PageHeader title="General groups" description={`Open ${info.name} ${k.title.toLowerCase()} rooms. Join any of them.`}
        crumbs={[{ label: info.name, href: `/learn/${category}` }, { label: k.title, href: base }, { label: "General groups" }]} />
      <GroupList groups={(groups ?? []) as Group[]} category={category} joined={new Set((mine ?? []).map((m) => m.group_id))}
        empty="General groups have not been created yet. The database seed (supabase/migrations/0002) creates them." />
    </>
  );
}
