/** Eyebrow, heading, gold rule and an optional lead. One pattern for every landing section. */
export function SectionHead({ eyebrow, title, children, className }: { eyebrow: string; title: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{eyebrow}</p>
      <h2 className="mt-4 max-w-2xl text-3xl leading-[1.1] sm:text-4xl lg:text-5xl">{title}</h2>
      <div className="foil mt-6" aria-hidden="true" />
      {children && <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">{children}</p>}
    </div>
  );
}
