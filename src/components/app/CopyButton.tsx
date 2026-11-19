"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" aria-label={label}
      onClick={async () => { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); } catch {} }}
      className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg hover:bg-muted">
      {done ? <Check size={16} className="text-success" /> : <Copy size={16} />}
      <span className="sr-only" aria-live="polite">{done ? "Copied" : ""}</span>
    </button>
  );
}
