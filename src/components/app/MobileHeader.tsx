import { Logo } from "@/components/Logo";
import { AccountMenu } from "@/components/app/AccountMenu";

/** Compact top bar below lg: wordmark and the account sheet button. */
export function MobileHeader({ name, studentId, isAdmin, signOut }: { name: string; studentId: string; isAdmin: boolean; signOut: () => Promise<void> }) {
  return (
    <header className="band-surface sticky top-0 z-40 border-b border-accent/30 bg-band pt-[env(safe-area-inset-top)] lg:hidden">
      <div className="flex h-14 items-center justify-between gap-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]">
        <Logo href="/dashboard" inverse className="min-w-0" />
        <AccountMenu name={name} studentId={studentId} isAdmin={isAdmin} signOut={signOut} />
      </div>
    </header>
  );
}
