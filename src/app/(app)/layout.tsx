import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app/Sidebar";

async function signOut() {
  "use server";
  await (await createClient()).auth.signOut();
  redirect("/");
}

async function Shell({ children }: { children: React.ReactNode }) {
  const { profile } = await requireSession();
  return <AppShell name={profile.display_name} studentId={profile.student_id} isAdmin={profile.role === "admin"} signOut={signOut}>{children}</AppShell>;
}

/** Session access is request-time data, so it lives under a Suspense boundary (Cache Components). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-10 text-muted-foreground" role="status">Loading…</div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
