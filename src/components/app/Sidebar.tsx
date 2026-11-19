"use client";
import { useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { NavProgress } from "@/components/app/NavProgress";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, LogOut, Menu, Shield, User, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PendingButton } from "@/components/ui/pending-button";
import { cn } from "@/lib/utils";

/** Small spinner shown inside a nav link while its route is loading (must render inside <Link>). */
function PendingDot() {
  const { pending } = useLinkStatus();
  return pending ? <span aria-hidden="true" className="ol-spinner ml-auto h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" /> : null;
}

type Props = { name: string; studentId: string; isAdmin: boolean; signOut: () => Promise<void> };

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
    { href: "/learn", label: "Start Learning", icon: GraduationCap },
    { href: "/profile", label: "Profile", icon: User },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];
  const nav = (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link key={it.href} href={it.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
            className={cn("flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors",
              active ? "bg-accent text-on-accent" : "text-band-muted hover:bg-white/10 hover:text-on-band")}>
            <it.icon size={18} strokeWidth={1.9} aria-hidden="true" /> {it.label}
            <PendingDot />
          </Link>
        );
      })}
    </nav>
  );
  const footer = (
    <div className="mt-auto border-t border-white/15 pt-4">
      <div className="px-3">
        <p className="truncate text-sm font-semibold text-on-band" title={name}>{name}</p>
        <p className="num mt-0.5 font-mono text-xs text-band-muted">{studentId}</p>
      </div>
      <div className="mt-3 flex items-center gap-1">
        <form action={signOut} className="flex-1">
          <PendingButton className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium text-band-muted hover:bg-white/10 hover:text-on-band" pendingText="Signing out…"><LogOut size={16} aria-hidden="true" />Sign out</PendingButton>
        </form>
        <ThemeToggle className="text-band-muted hover:bg-white/10 hover:text-on-band" />
      </div>
    </div>
  );
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <NavProgress />
      <aside className="band-surface sticky top-0 hidden h-dvh flex-col gap-8 bg-band p-4 lg:flex">
        <Logo href="/dashboard" inverse className="px-2 pt-2" />
        {nav}
        {footer}
      </aside>
      <div className="band-surface lg:hidden">
        <div className="sticky top-0 z-30 flex min-h-14 items-center justify-between bg-band pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)]">
          <Logo href="/dashboard" inverse />
          <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)} className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-on-band hover:bg-white/10">
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
        {open && (
          <div id="mobile-nav" className="fixed inset-x-0 bottom-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-20 flex flex-col gap-6 overflow-y-auto overscroll-contain bg-band pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-4">
            {nav}{footer}
          </div>
        )}
      </div>
      <main id="main" className="mx-auto w-full min-w-0 max-w-5xl px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6 sm:py-8 lg:px-10 lg:py-12">{children}</main>
    </div>
  );
}
