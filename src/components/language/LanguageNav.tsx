"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mic, MessageSquare, Newspaper, Users, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = "/learn/languages";
const ITEMS = [
  { href: BASE, label: "Overview", icon: Home, match: (p: string) => p === BASE },
  { href: `${BASE}/voice`, label: "Voice Rooms", icon: Mic, match: (p: string) => p.startsWith(`${BASE}/voice`) },
  { href: `${BASE}/chat`, label: "Chat Rooms", icon: MessageSquare, match: (p: string) => p.startsWith(`${BASE}/chat`) },
  { href: `${BASE}/community`, label: "Community", icon: Newspaper, match: (p: string) => p.startsWith(`${BASE}/community`) },
  { href: `${BASE}/friends/my-friends`, label: "Friends", icon: Users, match: (p: string) => p.startsWith(`${BASE}/friends`) },
  { href: `${BASE}/preferences`, label: "Preferences", icon: SlidersHorizontal, match: (p: string) => p.startsWith(`${BASE}/preferences`) },
];

/** Sub-navigation for the Language Learning community. Hidden during onboarding. */
export function LanguageNav() {
  const pathname = usePathname().replace(/\/$/, "");
  if (pathname.endsWith("/setup")) return null;
  return (
    <nav aria-label="Language Learning" className="mb-6 min-w-0 border-b border-border">
      <ul className="-mb-px flex gap-1 overflow-x-auto overscroll-x-contain pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ITEMS.map((it) => {
          const active = it.match(pathname);
          return (
            <li key={it.href} className="shrink-0">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-semibold transition-colors",
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <it.icon size={16} strokeWidth={1.9} aria-hidden="true" />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
