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
  return <AppShell name={profile.display_name} studentId={profile.student_id} isAdmin={profile.role === "admin"} category={profile.category} signOut={signOut}>{children}</AppShell>;
}

/** Same frame as the real shell (right rail on lg+, header and tab bar below) so the page does not jump when the session resolves. */
function ShellSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="min-h-dvh lg:pr-[272px]">
      <div aria-hidden="true" className="band-surface sticky top-0 z-40 h-[calc(3.5rem+env(safe-area-inset-top))] border-b border-accent/30 bg-band lg:hidden" />
      <aside aria-hidden="true" className="band-surface fixed inset-y-0 right-0 z-40 hidden w-[272px] border-l border-accent/30 bg-band lg:block" />
      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-20 lg:pt-10">
        <PageHeaderSkeleton /><RowListSkeleton rows={3} /><Skeleton className="sr-only" />
      </main>
      <div aria-hidden="true" className="band-surface fixed inset-x-0 bottom-0 z-40 h-[calc(4rem+env(safe-area-inset-bottom))] border-t border-accent/30 bg-band lg:hidden" />
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
