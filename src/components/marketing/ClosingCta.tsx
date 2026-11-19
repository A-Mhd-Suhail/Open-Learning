import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function ClosingCta() {
  return (
    <section className="band-surface bg-band text-on-band">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-end lg:py-24">
        <div>
          <h2 className="max-w-2xl text-3xl leading-[1.1] sm:text-4xl lg:text-5xl">Learn Together. Grow Together. Solve Together.</h2>
          <div className="foil mt-6" aria-hidden="true" />
          <p className="mt-5 text-band-muted">Sign in with Google and your Student ID is ready in a minute.</p>
        </div>
        <ButtonLink href="/onboarding" size="lg" variant="accent" className="w-full md:w-auto">Sign in <ArrowRight size={18} aria-hidden="true" /></ButtonLink>
      </div>
    </section>
  );
}
