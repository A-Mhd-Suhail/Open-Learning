import { NavProgress } from "@/components/app/NavProgress";
import { NavTracker } from "@/components/app/NavTracker";
import { RightRail } from "@/components/app/RightRail";
import { MobileHeader } from "@/components/app/MobileHeader";
import { MobileTabBar } from "@/components/app/MobileTabBar";
import type { PathCategory } from "@/components/app/nav-items";

type Props = { name: string; studentId: string; isAdmin: boolean; category?: PathCategory | null; signOut: () => Promise<void> };

/**
 * Signed-in frame. lg+: fixed 272px right-hand navigation panel, content column fills the rest.
 * Below lg: compact header, bottom tab bar and an account sheet.
 */
export function AppShell({ name, studentId, isAdmin, category, signOut, children }: Props & { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:pr-[272px]">
      <NavProgress />
      <NavTracker />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent">Skip to content</a>
      <MobileHeader name={name} studentId={studentId} isAdmin={isAdmin} signOut={signOut} />
      <RightRail name={name} studentId={studentId} isAdmin={isAdmin} category={category ?? "school"} signOut={signOut} />
      <main id="main" className="mx-auto w-full min-w-0 max-w-6xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-20 lg:pt-10">{children}</main>
      <MobileTabBar />
    </div>
  );
}
