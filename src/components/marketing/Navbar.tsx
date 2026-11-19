"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#categories", label: "Categories" },
  { href: "#together", label: "Study together" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background pt-[env(safe-area-inset-top)]">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6" aria-label="Main">
        <Logo />
        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{l.label}</a>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <ButtonLink href="/onboarding">Start Open Learning</ButtonLink>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-md hover:bg-muted"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>
      {open && (
        <div id="mobile-menu" className="max-h-[calc(100dvh-4rem-env(safe-area-inset-top))] overflow-y-auto border-t border-border bg-background pb-[max(1.25rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-3 md:hidden">
          <ul className="flex flex-col divide-y divide-border">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="block py-3 text-base font-medium">{l.label}</a>
              </li>
            ))}
          </ul>
          <ButtonLink href="/onboarding" className="mt-4 w-full">Start Open Learning</ButtonLink>
        </div>
      )}
    </header>
  );
}
