import { cn } from "@/lib/utils";

const TONES = {
  neutral: "border-border bg-muted text-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
  success: "border-success/30 bg-success/10 text-success",
  accent: "border-accent bg-accent text-on-accent",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
} as const;

export function Badge({ tone = "neutral", children, className }: { tone?: keyof typeof TONES; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5", TONES[tone], className)}>
      {children}
    </span>
  );
}
