import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "ol-pressable inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
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

