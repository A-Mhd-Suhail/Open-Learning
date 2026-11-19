"use client";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath, primaryNav } from "@/components/app/nav-items";
import { cn } from "@/lib/utils";

function Label({ active, children }: { active: boolean; children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return <span className={cn("text-xs font-semibold leading-none", pending && "animate-pulse motion-reduce:animate-none", active ? "text-on-band" : "")}>{children}</span>;
}

/** Fixed bottom tab bar below lg: Home, Learn, Language, Profile. Admin lives in the account sheet. */
export function MobileTabBar() {
  const pathname = usePathname();
  const tabs = primaryNav(false);
  return (
    <nav aria-label="Primary" className="band-surface fixed inset-x-0 bottom-0 z-40 border-t border-accent/30 bg-band pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid grid-cols-4 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        {tabs.map((t) => {
          const active = isActivePath(pathname, t.href);
          return (
            <li key={t.href}>
              <Link href={t.href} aria-current={active ? "page" : undefined}
                className={cn("focus-ring relative flex h-16 min-w-0 flex-col items-center justify-center gap-1.5 px-1 transition-colors", active ? "text-accent" : "text-band-muted hover:text-on-band")}>
                {active && <span aria-hidden="true" className="absolute inset-x-5 top-0 h-0.5 rounded-b bg-accent" />}
                <t.icon size={22} strokeWidth={active ? 2.1 : 1.7} aria-hidden="true" />
                <Label active={active}>{t.short ?? t.label}</Label>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
