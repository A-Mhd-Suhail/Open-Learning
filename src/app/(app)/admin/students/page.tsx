import type { Metadata } from "next";
import { PendingButton } from "@/components/ui/pending-button";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata: Metadata = { title: "Students · Admin" };

export default async function StudentsPage({ searchParams }: PageProps<"/admin/students">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60).replace(/[%,()]/g, "") : "";
  let query = supabase.from("profiles").select("student_id, display_name, email, category, role, created_at").order("created_at", { ascending: false }).limit(200);
  if (q) query = query.or(`student_id.ilike.%${q}%,display_name.ilike.%${q}%,email.ilike.%${q}%`);
  const { data: students } = await query;
  return (
    <>
      <PageHeader title="Students" crumbs={[{ label: "Admin", href: "/admin" }, { label: "Students" }]} />
      <form className="mb-4 flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">Search students</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search name, email or Student ID" className="h-11 min-w-0 flex-1 sm:max-w-sm sm:flex-none sm:w-full rounded-md border border-border bg-card px-4 text-sm" />
        <PendingButton className="h-11 cursor-pointer rounded-md bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover">Search</PendingButton>
      </form>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-muted-foreground"><tr>{["Student ID", "Name", "Email", "Category", "Role", "Joined"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {(students ?? []).map((s) => (
              <tr key={s.student_id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono">{s.student_id}</td><td className="px-4 py-3">{s.display_name}</td><td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">{s.category ?? "—"}</td><td className="px-4 py-3">{s.role}</td>
                <td className="px-4 py-3">{new Date(s.created_at).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
            {!students?.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No students found.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
