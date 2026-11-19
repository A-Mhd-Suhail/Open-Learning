import { ArrowRight, BookOpen, Languages, MessageSquare, Mic } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/components/icons";

const DOES = [
  { icon: BookOpen, label: "Video lessons" },
  { icon: MessageSquare, label: "Study groups" },
  { icon: Mic, label: "Voice and chat rooms" },
  { icon: Languages, label: "Language practice" },
];

/** First screen: what Open Learning is, what a student can do, one sign-in action. */
export function Hero() {
  const live = CATEGORIES.filter((c) => c.available);
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-14 px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:pb-24 lg:pt-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">School · JEE · NEET · Languages</p>
          <h1 className="mt-5 text-[2.5rem] leading-[1.04] min-[400px]:text-5xl sm:text-6xl xl:text-[4.25rem]">
            Connecting Students. <span className="block">Empowering Every Learner.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            A platform that brings students together to learn, share knowledge, build connections, and grow together.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            {DOES.map((d) => (
              <li key={d.label} className="inline-flex items-center gap-2"><d.icon size={16} className="text-gold" aria-hidden="true" />{d.label}</li>
            ))}
          </ul>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/onboarding" size="lg" className="w-full sm:w-auto">Sign in <ArrowRight size={18} aria-hidden="true" /></ButtonLink>
            <ButtonLink href="#features" size="lg" variant="secondary" className="w-full sm:w-auto">See what you can do</ButtonLink>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Continue with Google. You get a permanent Student ID.</p>
          <p className="mt-10 border-t border-border pt-5 font-display text-lg font-semibold tracking-tight">Learn Together. Grow Together. Solve Together.</p>
        </div>

        {/* The student pass: the thing you get on sign-in, with the paths it opens. Illustrative, labelled. */}
        <figure className="m-0 mx-auto w-full max-w-md lg:max-w-none">
          <div className="band-surface rounded-lg border border-accent/40 bg-band p-6 text-on-band sm:p-8" role="img" aria-label="Illustration of a Student ID card and the four learning paths that are open">
            <div aria-hidden="true">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-band-muted"><span>Open Learning</span><span>Student</span></div>
              <p className="mt-10 text-sm text-band-muted">Student ID</p>
              <p className="num mt-1 break-all font-mono text-2xl font-semibold tracking-wide text-accent sm:text-3xl">OL-2026-000042</p>
              <div className="foil-line mt-8" />
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-band-muted">Open to you</p>
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {live.map((c) => {
                  const Icon = CATEGORY_ICONS[c.icon];
                  return (
                    <li key={c.slug} className="flex min-h-12 items-center gap-3 rounded-md border border-white/15 px-3 py-2 text-sm font-semibold">
                      <Icon size={18} strokeWidth={1.7} className="shrink-0 text-accent" />
                      <span className="leading-tight">{c.name}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          <figcaption className="mt-3 text-xs text-muted-foreground">Illustration. Your own Student ID is created when you sign in, and it never changes.</figcaption>
        </figure>
      </div>
    </section>
  );
}
