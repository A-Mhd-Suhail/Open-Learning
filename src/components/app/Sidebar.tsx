"use client";
import { useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, LogOut, Menu, Shield, User, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { NavProgress } from "@/components/app/NavProgress";
import { AccountMenu } from "@/components/app/AccountMenu";
import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/utils";

/** Small spinner shown inside a nav link while its route is loading (must render inside <Link>). */
function PendingDot() {
  const { pending } = useLinkStatus();
  return pending ? <span aria-hidden="true" className="ol-spinner ml-1 inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent" /> : null;
}

type Props = { name: string; studentId: string; isAdmin: boolean; signOut: () => Promise<void> };

/** Signed-in frame: a black header with the wordmark, primary navigation and the account menu; content below. */
export function AppShell({ name, studentId, isAdmin, signOut, children }: Props & { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/learn", label: "Learn", icon: GraduationCap },
    { href: "/profile", label: "Profile", icon: User },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  return (
    <div className="min-h-dvh">
      <NavProgress />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent">Skip to content</a>
      <header className="band-surface sticky top-0 z-40 border-b border-accent/30 bg-band pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6">
          <Logo href="/dashboard" inverse />
          <nav aria-label="Primary" className="hidden h-full items-stretch gap-1 md:flex">
            {items.map((it) => (
              <Link key={it.href} href={it.href} aria-current={isActive(it.href) ? "page" : undefined}
                className={cn("relative inline-flex items-center gap-2 px-4 text-sm font-semibold transition-colors",
                  isActive(it.href) ? "text-on-band after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-accent" : "text-band-muted hover:text-on-band")}>
                {it.label}<PendingDot />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <AccountMenu name={name} studentId={studentId} signOut={signOut} />
            <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((v) => !v)}
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-on-band hover:bg-white/10 md:hidden">
              {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>
        {open && (
          <div id="mobile-nav" className="ol-fade-in fixed inset-x-0 bottom-0 top-[calc(4rem+env(safe-area-inset-top))] z-30 flex flex-col overflow-y-auto overscroll-contain bg-band px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 md:hidden">
            <nav aria-label="Primary" className="flex flex-col">
              {items.map((it) => (
                <Link key={it.href} href={it.href} onClick={() => setOpen(false)} aria-current={isActive(it.href) ? "page" : undefined}
                  className={cn("flex h-14 items-center gap-4 border-b border-white/10 font-display text-xl", isActive(it.href) ? "text-accent" : "text-on-band")}>
                  <it.icon size={20} strokeWidth={1.7} aria-hidden="true" />{it.label}
                </Link>
              ))}
            </nav>
            <form action={signOut} className="mt-auto pt-6">
              <PendingButton pendingText="Signing out…" className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-white/20 text-sm font-semibold text-on-band hover:border-accent"><LogOut size={16} aria-hidden="true" />Sign out</PendingButton>
            </form>
          </div>
        )}
      </header>
      <main id="main" className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 pb-[max(3rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6 sm:py-12">{children}</main>
    </div>
  );
}
