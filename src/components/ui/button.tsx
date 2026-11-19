import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-hover",
        secondary: "border border-border bg-card text-foreground hover:border-foreground/40 hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        /** Highlighter yellow: only for the single primary action on a navy band. */
        accent: "bg-accent text-on-accent hover:brightness-95",
      },
      size: {
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

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
  variant, size, className, ...rest
}: Props & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...rest} />;
}
