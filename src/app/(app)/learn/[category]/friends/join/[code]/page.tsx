import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LinkIcon } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button-variants";
import { requireSession } from "@/lib/auth";
import { groupPath } from "@/lib/groups";

export const metadata: Metadata = { title: "Join group" };

/** Invite link: /learn/<category>/friends/join/<code>. Joins the group, then opens it. A bad link shows a clear message, not a blank 404. */
export default async function JoinByInvite({ params }: PageProps<"/learn/[category]/friends/join/[code]">) {
  const { category, code } = await params;
  const hub = `/learn/${category}/friends`;
  let target: string | null = null;
  if (/^[a-f0-9]{32}$/.test(code)) {
    const { supabase } = await requireSession();
    const { data: id, error } = await supabase.rpc("join_group_by_invite", { p_code: code });
    if (!error && id) {
      const { data: g } = await supabase.from("groups").select("type, category").eq("id", id).single();
      if (g) target = groupPath(g.category ?? category, g.type, id as string);
    }
  }
  if (target) redirect(target);
  return (
    <>
      <PageHeader title="Invite link" crumbs={[{ label: "Learn", href: "/learn" }, { label: "Learn With Friends", href: hub }, { label: "Invite link" }]} backHref={hub} />
      <div role="alert" className="mx-auto max-w-xl">
        <EmptyState icon={LinkIcon} title="This invite link does not work"
          description="It may have been copied incompletely, or the group no longer exists. Ask the person who invited you for a fresh link."
          action={<Link href={hub} className={buttonVariants({ variant: "secondary" })}>Back to Learn With Friends</Link>} />
      </div>
    </>
  );
}
