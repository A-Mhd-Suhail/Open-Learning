"use client";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar } from "@/components/ui/avatar";
import { PendingButton } from "@/components/ui/pending-button";
import { StudentIdCopy } from "@/components/app/AccountMenu";
import { isActivePath, jumpTo, primaryNav, type NavItem, type PathCategory } from "@/components/app/nav-items";
import { cn } from "@/lib/utils";

function PendingDot() {
  const { pending } = useLinkStatus();
  return pending ? <span aria-hidden="true" className="ol-spinner ml-auto inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" /> : null;
}

function RailLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined}
      className={cn("focus-ring ol-pressable relative flex h-11 items-center gap-3 rounded-md pl-4 pr-3 text-sm font-semibold transition-colors",
        active ? "bg-white/10 text-on-band" : "text-band-muted hover:bg-white/5 hover:text-on-band")}>
      {active && <span aria-hidden="true" className="nav-active-bar" />}
      <item.icon size={18} strokeWidth={active ? 2.1 : 1.75} aria-hidden="true" className={active ? "text-accent" : ""} />
      <span className="truncate">{item.label}</span>
      <PendingDot />
    </Link>
  );
}

/** Desktop (lg+) right-side navigation panel: fixed, full height, 272px. */
export function RightRail({ name, studentId, isAdmin, category, signOut }: { name: string; studentId: string; isAdmin: boolean; category: PathCategory; signOut: () => Promise<void> }) {
  const pathname = usePathname();
  const primary = primaryNav(isAdmin);
  const jump = jumpTo(category);
  return (
    <aside aria-label="Sidebar" className="band-surface fixed inset-y-0 right-0 z-40 hidden w-[272px] flex-col border-l border-accent/30 bg-band lg:flex">
      <div className="flex h-20 shrink-0 items-center px-5"><Logo href="/dashboard" inverse /></div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
        <nav aria-label="Primary" className="space-y-1">
          {primary.map((it) => <RailLink key={it.href} item={it} active={isActivePath(pathname, it.href)} />)}
        </nav>
        <p className="t-eyebrow mb-2 mt-8 px-4 !text-band-muted">Jump to</p>
        <nav aria-label="Shortcuts" className="space-y-1">
          {jump.map((it) => <RailLink key={it.href} item={it} active={pathname === it.href || pathname.startsWith(it.href + "/")} />)}
        </nav>
      </div>
      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={name} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" title={name}>{name}</p>
            <StudentIdCopy studentId={studentId} className="-mb-1" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <form action={signOut} className="flex-1">
            <PendingButton pendingText="Signing out…" className="focus-ring flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-white/15 text-sm font-semibold hover:border-accent">
              <LogOut size={16} aria-hidden="true" />Sign out
            </PendingButton>
          </form>
          <ThemeToggle className="border border-white/15" />
        </div>
      </div>
    </aside>
  );
}
