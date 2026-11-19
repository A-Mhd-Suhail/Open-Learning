import type { Metadata } from "next";
import { Film, Users, UsersRound } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { RowLink, RowList } from "@/components/ui/row-link";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const count = async (t: string) => (await supabase.from(t).select("*", { count: "exact", head: true })).count ?? 0;
  const [students, videos, groups] = await Promise.all([count("profiles"), count("videos"), count("groups")]);
  return (
    <>
      <PageHeader title="Admin" description="Manage content and monitor the platform." crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin" }]} backHref="/dashboard" />
      <RowList>
        <li><RowLink icon={Film} title="Videos" meta={videos} description="Import from Google Sheets or Excel, edit, delete." href="/admin/videos" /></li>
        <li><RowLink icon={Users} title="Students" meta={students} description="Registered students and their Student IDs." href="/admin/students" /></li>
        <li><RowLink icon={UsersRound} title="Groups" meta={groups} description="Discussion, chat and voice groups." href="/admin/groups" /></li>
      </RowList>
    </>
  );
}
