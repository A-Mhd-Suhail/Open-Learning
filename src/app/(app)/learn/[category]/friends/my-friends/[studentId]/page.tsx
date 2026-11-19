import type { Metadata } from "next";
import { PendingButton } from "@/components/ui/pending-button";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { requireSession } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import type { PublicProfile } from "@/lib/groups";
import { sendFriendRequestAction } from "../../actions";
import { InviteToGroup } from "./InviteToGroup";

export const metadata: Metadata = { title: "Student profile" };

export default async function StudentProfile({ params }: PageProps<"/learn/[category]/friends/my-friends/[studentId]">) {
  const { category, studentId } = await params;
  if (!/^OL-\d{4}-\d{6}$/.test(studentId)) notFound();
  const { supabase, user } = await requireSession();
  const { data } = await supabase.from("public_profiles").select("*").eq("student_id", studentId).maybeSingle();
  const p = data as PublicProfile | null;
  if (!p) notFound();
  const info = getCategory(category)!;
  const isMe = p.id === user.id;
  const [{ data: fs }, { data: owned }] = await Promise.all([
    supabase.from("friendships").select("user_a").or(`user_a.eq.${p.id},user_b.eq.${p.id}`),
    supabase.from("group_members").select("group_id, groups(id, name)").eq("user_id", user.id).eq("role", "owner"),
  ]);
  const { data: mine } = await supabase.from("friendships").select("user_a, user_b");
  const isFriend = (mine ?? []).some((f) => f.user_a === p.id || f.user_b === p.id);
  void fs;
  const groups = ((owned ?? []) as unknown as { groups: { id: string; name: string } | null }[]).flatMap((o) => (o.groups ? [o.groups] : []));
  const joined = new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(new Date(p.created_at));
  return (
    <>
      <PageHeader title={p.display_name} crumbs={[{ label: "Learn", href: "/learn" }, { label: info.name, href: `/learn/${category}` }, { label: "Learn With Friends", href: `/learn/${category}/friends` }, { label: "Friends", href: `/learn/${category}/friends/my-friends` }, { label: p.display_name }]} backHref={`/learn/${category}/friends/my-friends`} />
      <section className="max-w-xl rounded-lg border border-border bg-card p-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Student ID</dt><dd className="font-mono">{p.student_id}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Studying</dt><dd>{p.category ? p.category.toUpperCase() : "—"}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Member since</dt><dd>{joined}</dd></div>
        </dl>
        {!isMe && !isFriend && (
          <form action={sendFriendRequestAction} className="mt-5"><input type="hidden" name="id" value={p.id} /><PendingButton className="h-11 cursor-pointer rounded-md bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover">Send friend request</PendingButton></form>
        )}
        {!isMe && isFriend && <InviteToGroup friendId={p.id} groups={groups} />}
      </section>
    </>
  );
}
