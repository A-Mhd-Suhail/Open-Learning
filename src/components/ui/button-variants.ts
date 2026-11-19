import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "ol-pressable inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-hover",
        secondary: "border border-border bg-card text-foreground hover:border-foreground/40 hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        /** Gold foil: the single primary action on a black band or one CTA per view. */
        accent: "bg-accent text-on-accent hover:brightness-95",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-[52px] px-7 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

