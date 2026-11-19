"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, User } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CopyButton } from "@/components/app/CopyButton";
import { PendingButton } from "@/components/ui/pending-button";

/** Account dropdown: who you are, your Student ID (copyable), profile, theme and sign out. Closes on Esc, outside click and navigation. */
export function AccountMenu({ name, studentId, signOut }: { name: string; studentId: string; signOut: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); (ref.current?.querySelector("button") as HTMLElement | null)?.focus(); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="true" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}
        className="ol-pressable inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-white/20 pl-1 pr-3 text-on-band hover:border-accent">
        <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-display text-base font-semibold text-on-accent">{initial}</span>
        <span className="hidden max-w-[8rem] truncate text-sm font-semibold sm:block">{name.split(" ")[0]}</span>
        <ChevronDown size={16} aria-hidden="true" className={`text-band-muted transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div id={id} className="ol-pop absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl">
          <div className="border-b border-border p-4">
            <p className="truncate font-display text-lg font-semibold" title={name}>{name}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="num font-mono text-sm tracking-wide text-gold">{studentId}</p>
              <CopyButton value={studentId} label="Copy Student ID" />
            </div>
          </div>
          <div className="p-1.5">
            <Link href="/profile" onClick={() => setOpen(false)} className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold hover:bg-muted"><User size={16} aria-hidden="true" />Profile and settings</Link>
            <div className="flex h-11 items-center justify-between rounded-md px-3 text-sm font-semibold">
              <span>Appearance</span><ThemeToggle className="!h-9 !w-9" />
            </div>
          </div>
          <form action={signOut} className="border-t border-border p-1.5">
            <PendingButton pendingText="Signing out…" className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-sm font-semibold text-destructive hover:bg-muted"><LogOut size={16} aria-hidden="true" />Sign out</PendingButton>
          </form>
        </div>
      )}
    </div>
  );
}
