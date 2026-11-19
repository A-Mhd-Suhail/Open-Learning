import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { LibraryPreview } from "./LibraryPreview";

/** The black cover: the promise in three lines, and the library doing its job next to it. */
export function Hero() {
  return (
    <section className="band-surface bg-band text-on-band">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-28 lg:pt-24">
        <div>
          <h1 className="text-[2.4rem] leading-[1.06] min-[400px]:text-5xl sm:text-6xl xl:text-[3.9rem]">
            <span className="block sm:whitespace-nowrap">Learn anything.</span><span className="block sm:whitespace-nowrap">Learn together.</span><span className="block sm:whitespace-nowrap">Grow together.</span>
          </h1>
          <div className="foil mt-8" aria-hidden="true" />
          <p className="mt-6 max-w-md text-lg text-band-muted">
            A free library of lessons for School, JEE and NEET, sorted by class, subject and chapter, with study groups and voice rooms to work through it with friends.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/onboarding" size="lg" variant="accent">Get started <ArrowRight size={18} aria-hidden="true" /></ButtonLink>
            <ButtonLink href="#how-it-works" size="lg" className="border border-white/25 bg-transparent text-on-band hover:border-accent hover:bg-transparent">See how it works</ButtonLink>
          </div>
        </div>
        <LibraryPreview />
      </div>
    </section>
  );
}
