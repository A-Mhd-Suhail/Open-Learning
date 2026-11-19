import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { groupPath } from "@/lib/groups";

/** Invite link: /learn/<category>/friends/join/<code>. Joins the group, then opens it. */
export default async function JoinByInvite({ params }: PageProps<"/learn/[category]/friends/join/[code]">) {
  const { category, code } = await params;
  if (!/^[a-f0-9]{32}$/.test(code)) notFound();
  const { supabase } = await requireSession();
  const { data: id, error } = await supabase.rpc("join_group_by_invite", { p_code: code });
  if (error || !id) notFound();
  const { data: g } = await supabase.from("groups").select("type, category").eq("id", id).single();
  if (!g) notFound();
  redirect(groupPath(g.category ?? category, g.type, id as string));
}
