"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "./nav-data";

const OPEN_DELAY = 90;
const CLOSE_DELAY = 180;

/**
 * Top navigation. Desktop: three mega-menu panels that open on hover-intent and on click/keyboard, hung directly
 * under the header (absolute, so nothing shifts). Mobile: compact bar and a full-height drawer with accordions.
 */
export function Navbar() {
  const uid = useId();
  const [open, setOpen] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false); // opened by click/keyboard: hover-leave must not close it
  const [drawer, setDrawer] = useState(false);
  const [acc, setAcc] = useState<string | null>(NAV_GROUPS[0].id);
  const wrap = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});

  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  const close = useCallback((restoreTo?: string) => {
    clear(); setOpen(null); setPinned(false);
    if (restoreTo) triggers.current[restoreTo]?.focus();
  }, []);

  const hoverOpen = (id: string, e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clear();
    if (open) { setOpen(id); return; } // already browsing: switch instantly
    timer.current = setTimeout(() => { setOpen(id); setPinned(false); }, OPEN_DELAY);
  };
  const hoverLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clear();
    if (pinned) return;
    timer.current = setTimeout(() => setOpen(null), CLOSE_DELAY);
  };
  const toggle = (id: string) => {
    clear();
    if (open === id && pinned) { close(); return; }
    setOpen(id); setPinned(true);
  };

  // Outside click and Escape.
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) close(); };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open, close]);
  useEffect(() => () => clear(), []);

  // Drawer: scroll lock, Escape, close when the viewport becomes desktop.
  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawer(false); };
    const mq = window.matchMedia("(min-width: 1024px)");
    const mqf = () => { if (mq.matches) setDrawer(false); };
    document.addEventListener("keydown", key);
    mq.addEventListener("change", mqf);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", key); mq.removeEventListener("change", mqf); };
  }, [drawer]);

  const links = (id: string) => Array.from(wrap.current?.querySelectorAll<HTMLElement>(`[data-panel="${id}"] a`) ?? []);

  function onTriggerKey(e: React.KeyboardEvent, id: string, i: number) {
    const ids = NAV_GROUPS.map((g) => g.id);
    if (e.key === "ArrowDown") {
      e.preventDefault(); clear(); setOpen(id); setPinned(true);
      requestAnimationFrame(() => links(id)[0]?.focus());
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = ids[(i + (e.key === "ArrowRight" ? 1 : ids.length - 1)) % ids.length];
      triggers.current[next]?.focus();
      if (open) { setOpen(next); setPinned(true); }
    } else if (e.key === "Escape" && open) { close(id); }
  }
  function onPanelKey(e: React.KeyboardEvent, id: string) {
    const items = links(id);
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(idx + 1) % items.length]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (idx <= 0) triggers.current[id]?.focus(); else items[idx - 1]?.focus(); }
    else if (e.key === "Home") { e.preventDefault(); items[0]?.focus(); }
    else if (e.key === "End") { e.preventDefault(); items[items.length - 1]?.focus(); }
    else if (e.key === "Escape") { e.preventDefault(); close(id); }
  }
  function onBlurWrap(e: React.FocusEvent) {
    if (open && !wrap.current?.contains(e.relatedTarget as Node | null)) close();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background pt-[env(safe-area-inset-top)]">
      <div ref={wrap} className="relative" onBlur={onBlurWrap}>
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6" aria-label="Main">
          <div className="flex items-center gap-10">
            <Logo />
            <ul className="hidden items-center gap-1 lg:flex">
              {NAV_GROUPS.map((g, i) => {
                const isOpen = open === g.id;
                return (
                  <li key={g.id} onPointerEnter={(e) => hoverOpen(g.id, e)} onPointerLeave={hoverLeave}>
                    <button
                      ref={(el) => { triggers.current[g.id] = el; }}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`${uid}-${g.id}`}
                      aria-haspopup="true"
                      onClick={() => toggle(g.id)}
                      onKeyDown={(e) => onTriggerKey(e, g.id, i)}
                      className={cn("inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-colors duration-150 hover:bg-muted", isOpen ? "bg-muted text-foreground" : "text-foreground/80")}
                    >
                      {g.label}
                      <ChevronDown size={15} aria-hidden="true" className={cn("transition-transform duration-150", isOpen && "rotate-180")} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex items-center gap-2">
            <ButtonLink href="/onboarding" className="px-5">Sign in</ButtonLink>
            <button type="button" className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-foreground hover:bg-muted lg:hidden"
              aria-label={drawer ? "Close menu" : "Open menu"} aria-expanded={drawer} aria-controls="mobile-menu" onClick={() => setDrawer((v) => !v)}>
              {drawer ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </nav>

        {/* Desktop panels: always in the DOM (so aria-controls resolves), hidden until open. Flush under the header. */}
        {NAV_GROUPS.map((g) => (
          <div
            key={g.id} id={`${uid}-${g.id}`} data-panel={g.id} hidden={open !== g.id}
            role="region" aria-label={g.label}
            onPointerEnter={(e) => { if (e.pointerType === "mouse") clear(); }}
            onPointerLeave={hoverLeave}
            onKeyDown={(e) => onPanelKey(e, g.id)}
            className="absolute inset-x-0 top-full hidden border-b border-border bg-card shadow-[0_12px_24px_-12px_rgb(0_0_0/0.18)] lg:[&:not([hidden])]:block"
          >
            <div className="ol-fade-in mx-auto grid max-w-6xl grid-cols-[18rem_minmax(0,1fr)] gap-10 px-6 py-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{g.label}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{g.blurb}</p>
                {g.note && <p className="mt-4 border-l-2 border-accent pl-3 text-xs text-muted-foreground">{g.note}</p>}
              </div>
              <ul className={cn("grid gap-x-6 gap-y-1", g.items.length > 2 ? "grid-cols-2" : "grid-cols-1")}>
                {g.items.map((it) => (
                  <li key={it.href}>
                    <Link href={it.href} onClick={() => close()} className="group flex items-start gap-4 rounded-md p-3 transition-colors duration-150 hover:bg-muted focus-visible:bg-muted">
                      <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-band text-accent"><it.icon size={19} strokeWidth={1.7} /></span>
                      <span className="min-w-0">
                        <span className="block font-semibold leading-snug">{it.label}</span>
                        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{it.description}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div id="mobile-menu" className="ol-fade-in fixed inset-x-0 bottom-0 top-[calc(4rem+env(safe-area-inset-top))] z-40 overflow-y-auto overscroll-contain bg-background lg:hidden">
          <div className="flex min-h-full flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-2 sm:px-6">
            <ul className="border-b border-border">
              {NAV_GROUPS.map((g) => {
                const isOpen = acc === g.id;
                return (
                  <li key={g.id} className="border-t border-border first:border-t-0">
                    <button type="button" aria-expanded={isOpen} aria-controls={`m-${uid}-${g.id}`} onClick={() => setAcc(isOpen ? null : g.id)}
                      className="flex min-h-14 w-full cursor-pointer items-center justify-between py-3 text-left font-display text-xl font-semibold">
                      {g.label}
                      <ChevronDown size={20} aria-hidden="true" className={cn("text-muted-foreground transition-transform duration-150", isOpen && "rotate-180")} />
                    </button>
                    <ul id={`m-${uid}-${g.id}`} hidden={!isOpen} className="pb-3">
                      {g.items.map((it) => (
                        <li key={it.href}>
                          <Link href={it.href} onClick={() => setDrawer(false)} className="flex min-h-14 items-center gap-4 rounded-md px-1 py-2.5 active:bg-muted">
                            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-band text-accent"><it.icon size={19} strokeWidth={1.7} /></span>
                            <span className="min-w-0">
                              <span className="block font-semibold leading-snug">{it.label}</span>
                              <span className="block text-sm leading-snug text-muted-foreground">{it.description}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                      {g.note && <li className="px-1 pt-1 text-xs text-muted-foreground">{g.note}</li>}
                    </ul>
                  </li>
                );
              })}
            </ul>
            <div className="mt-auto pt-8">
              <ButtonLink href="/onboarding" size="lg" className="w-full">Sign in</ButtonLink>
              <p className="mt-3 text-center text-xs text-muted-foreground">Continue with Google. Free for students.</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
