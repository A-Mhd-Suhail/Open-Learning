"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/button";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#paths", label: "Paths" },
  { href: "#together", label: "Study together" },
];

/** Black header over the black hero: wordmark, three anchors and the one gold call to action. */
export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="band-surface sticky top-0 z-40 border-b border-accent/30 bg-band pt-[env(safe-area-inset-top)]">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6" aria-label="Main">
        <Logo inverse />
        <ul className="hidden items-center gap-9 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}><a href={l.href} className="text-sm font-semibold text-band-muted transition-colors hover:text-on-band">{l.label}</a></li>
          ))}
        </ul>
        <div className="hidden md:block"><ButtonLink href="/onboarding" variant="accent">Get started</ButtonLink></div>
        <button type="button" className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-on-band hover:bg-white/10 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="ol-fade-in max-h-[calc(100dvh-4rem-env(safe-area-inset-top))] overflow-y-auto border-t border-white/10 bg-band pb-[max(1.25rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-2 md:hidden">
          <ul className="flex flex-col">
            {LINKS.map((l) => (
              <li key={l.href}><a href={l.href} onClick={() => setOpen(false)} className="block border-b border-white/10 py-4 font-display text-xl">{l.label}</a></li>
            ))}
          </ul>
          <ButtonLink href="/onboarding" variant="accent" size="lg" className="mt-5 w-full">Get started</ButtonLink>
        </div>
      )}
    </header>
  );
}
