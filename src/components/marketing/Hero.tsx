import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { LibraryPreview } from "./LibraryPreview";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:pb-28 lg:pt-20">
      <div>
        <h1 className="text-[2.25rem] leading-[1.06] min-[400px]:text-[2.6rem] sm:text-6xl">
          Learn anything.<br />
          <span className="mark">Learn together.</span><br />
          Grow together.
        </h1>
        <p className="mt-6 max-w-lg text-lg text-muted-foreground">
          A free library of lessons for School, JEE and NEET, sorted by class, subject and chapter, with study groups and voice rooms to work through it with friends.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink href="/onboarding" size="lg">
            Start Open Learning <ArrowRight size={18} aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href="#how-it-works" size="lg" variant="secondary">See how it works</ButtonLink>
        </div>
      </div>
      <LibraryPreview />
    </section>
  );
}
