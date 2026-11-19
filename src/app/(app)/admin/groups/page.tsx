import type { Metadata } from "next";
import { PendingButton } from "@/components/ui/pending-button";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata: Metadata = { title: "Groups · Admin" };

async function deleteGroup(formData: FormData) {
  "use server";
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  await supabase.from("groups").delete().eq("id", id).eq("is_general", false); // general groups are permanent
  revalidatePath("/admin/groups");
}

export default async function GroupsPage() {
  const { supabase } = await requireAdmin();
  const { data: groups } = await supabase.from("groups").select("id, name, type, category, visibility, is_general, created_at, group_members(count)").order("created_at", { ascending: false }).limit(300);
  return (
    <>
      <PageHeader title="Groups" description="General groups are permanent. Student-created groups can be removed." crumbs={[{ label: "Admin", href: "/admin" }, { label: "Groups" }]} backHref="/admin" />
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-muted-foreground"><tr>{["Name", "Type", "Category", "Access", "Members", ""].map((h, i) => <th key={i} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {(groups ?? []).map((g) => (
              <tr key={g.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{g.name}{g.is_general && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">General</span>}</td>
                <td className="px-4 py-3 capitalize">{g.type}</td><td className="px-4 py-3 uppercase">{g.category}</td><td className="px-4 py-3 capitalize">{g.visibility}</td>
                <td className="px-4 py-3">{(g.group_members as unknown as { count: number }[])[0]?.count ?? 0}</td>
                <td className="px-4 py-3 text-right">{!g.is_general && (
                  <form action={deleteGroup}><input type="hidden" name="id" value={g.id} /><PendingButton className="h-11 cursor-pointer rounded-lg px-3 text-sm font-semibold text-destructive hover:bg-muted">Delete</PendingButton></form>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
