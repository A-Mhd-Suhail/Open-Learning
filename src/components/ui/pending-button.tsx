"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/**
 * Submit button that keeps the caller's own styling but shows a spinner, optional pending label and blocks
 * double submits while the surrounding <form action> is running. Use inside server-action forms.
 */
export function PendingButton({ children, pendingText, className, disabled, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" {...rest} disabled={disabled || pending} aria-busy={pending || undefined}
      className={`${className ?? ""} ol-pressable disabled:cursor-not-allowed disabled:opacity-60`}>
      {pending && <Loader2 size={16} aria-hidden="true" className="ol-spinner mr-2 inline-block shrink-0" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
