import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app/Sidebar";
import { PageHeaderSkeleton, RowListSkeleton, Skeleton } from "@/components/ui/skeleton";

async function signOut() {
  "use server";
  await (await createClient()).auth.signOut();
  redirect("/");
}

async function Shell({ children }: { children: React.ReactNode }) {
  const { profile } = await requireSession();
  return <AppShell name={profile.display_name} studentId={profile.student_id} isAdmin={profile.role === "admin"} signOut={signOut}>{children}</AppShell>;
}

/** Same frame as the real shell (navy sidebar, content column) so the page does not jump when the session resolves. */
function ShellSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside aria-hidden="true" className="hidden h-dvh flex-col gap-8 bg-band p-4 lg:flex">
        <div className="h-8 w-36 rounded-md bg-white/10" />
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-11 rounded-md bg-white/10" />)}</div>
      </aside>
      <div aria-hidden="true" className="h-14 bg-band lg:hidden" />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-12">
        <PageHeaderSkeleton /><RowListSkeleton rows={3} /><Skeleton className="sr-only" />
      </main>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Session access is request-time data, so it lives under a Suspense boundary (Cache Components). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
