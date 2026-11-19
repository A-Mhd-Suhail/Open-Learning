"use client";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "./button-variants";
import { cn } from "@/lib/utils";

type Props = VariantProps<typeof buttonVariants> & { className?: string };

export function ButtonLink({
  href, variant, size, className, children,
}: Props & { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </Link>
  );
}

export function Button({
  variant, size, className, loading, loadingText, children, disabled, ...rest
}: Props & React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; loadingText?: string }) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <Loader2 size={16} aria-hidden="true" className="ol-spinner" />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

/** Submit button for plain server-action forms: reads the form's pending state, so double submits are blocked and the label changes. */
export function SubmitButton({ children, pendingText, ...props }: Omit<React.ComponentProps<typeof Button>, "loading" | "type"> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending} loadingText={pendingText} {...props}>{children}</Button>;
}
