"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode; className?: string };

/**
 * Modal built on the native <dialog>: the browser supplies the focus trap, inert background,
 * Esc handling and focus return. Bottom sheet below 640px, centred card above.
 */
export function Dialog({ open, onClose, title, description, children, className }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClose={() => { if (open) onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className={cn(
        "ol-dialog fixed inset-x-0 bottom-0 top-auto m-0 max-h-[90dvh] w-full max-w-none overflow-hidden rounded-b-none rounded-t-lg border border-border bg-card p-0 text-card-foreground shadow-float backdrop:bg-black/50",
        "sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[85dvh] sm:max-w-lg sm:rounded-lg",
        className,
      )}
    >
      <div className="flex max-h-[90dvh] flex-col sm:max-h-[85dvh]">
        <div className="flex items-start gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1 pt-1.5">
            <h2 id={titleId} className="t-h3">{title}</h2>
            {description && <p id={descId} className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-5">
          {open ? children : null}
        </div>
      </div>
    </dialog>
  );
}
