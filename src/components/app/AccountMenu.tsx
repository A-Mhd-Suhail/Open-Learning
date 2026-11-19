"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Copy, LogOut, Shield, User } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar } from "@/components/ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import { PendingButton } from "@/components/ui/pending-button";

/** Student ID with a copy control. Gold monospace; the button announces "Copied". */
export function StudentIdCopy({ studentId, className = "" }: { studentId: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className={`flex min-w-0 items-center gap-1 ${className}`}>
      <span className="num truncate font-mono text-sm tracking-wide text-gold">{studentId}</span>
      <button type="button" aria-label="Copy Student ID"
        onClick={async () => { try { await navigator.clipboard.writeText(studentId); setDone(true); setTimeout(() => setDone(false), 1500); } catch {} }}
        className="focus-ring ol-pressable -my-2 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
        {done ? <Check size={16} aria-hidden="true" className="text-success" /> : <Copy size={16} aria-hidden="true" />}
        <span className="sr-only" aria-live="polite">{done ? "Copied" : ""}</span>
      </button>
    </div>
  );
}

/** Mobile account sheet: avatar button opening a bottom sheet with student card, appearance, profile/admin and sign out. */
export function AccountMenu({ name, studentId, isAdmin = false, signOut }: { name: string; studentId: string; isAdmin?: boolean; signOut: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const row = "focus-ring flex h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold hover:bg-muted";
  return (
    <>
      <button type="button" aria-haspopup="dialog" aria-label="Open account menu" onClick={() => setOpen(true)}
        className="focus-ring ol-pressable inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full">
        <Avatar name={name} size="sm" className="border-accent/60" />
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Account">
        <div className="flex items-center gap-3 rounded-lg border border-border p-4">
          <Avatar name={name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="t-h3 truncate" title={name}>{name}</p>
            <p className="t-small text-muted-foreground">Student ID</p>
            <StudentIdCopy studentId={studentId} />
          </div>
        </div>
        <div className="mt-3 space-y-0.5">
          <Link href="/profile" onClick={() => setOpen(false)} className={row}><User size={18} aria-hidden="true" />Profile and settings</Link>
          {isAdmin && <Link href="/admin" onClick={() => setOpen(false)} className={row}><Shield size={18} aria-hidden="true" />Admin</Link>}
          <div className="flex h-12 items-center justify-between rounded-md px-3 text-sm font-semibold">
            <span>Appearance</span><ThemeToggle />
          </div>
        </div>
        <form action={signOut} className="mt-3 border-t border-border pt-3">
          <PendingButton pendingText="Signing out…" className="focus-ring flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-border text-sm font-semibold text-destructive hover:bg-muted">
            <LogOut size={16} aria-hidden="true" />Sign out
          </PendingButton>
        </form>
      </Dialog>
    </>
  );
}
