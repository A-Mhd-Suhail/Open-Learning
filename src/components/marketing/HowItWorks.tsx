import { Check } from "lucide-react";
import { SectionHead } from "./SectionHead";

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

const STEPS = [
  {
    title: "Sign in with Google",
    body: "One tap with your Google account. Tell us what to call you, and you are in.",
    visual: (
      <div className="flex h-11 items-center justify-center gap-2.5 rounded-md border border-border bg-card text-sm font-semibold"><GoogleGlyph />Continue with Google</div>
    ),
  },
  {
    title: "Get your permanent Student ID",
    body: "It is created automatically and never changes. Friends use it to find and add you.",
    visual: (
      <div className="band-surface rounded-md border border-accent/40 bg-band px-4 py-3">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-band-muted">Student ID</p>
        <p className="num mt-1 font-mono text-base font-semibold tracking-wide text-accent">OL-2026-000042</p>
      </div>
    ),
  },
  {
    title: "Learn and connect",
    body: "Open a path, watch lessons, join a study group or a voice room, and add friends.",
    visual: (
      <ul className="space-y-2">
        {["Watch a lesson", "Join a study group", "Add a friend"].map((t) => (
          <li key={t} className="flex h-9 items-center gap-2.5 rounded-md border border-border bg-card px-3 text-sm"><Check size={15} className="text-gold" aria-hidden="true" />{t}</li>
        ))}
      </ul>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y border-border bg-muted/50">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHead eyebrow="How it works" title="From sign-in to first lesson in three steps" />
        <ol className="mt-14 grid gap-10 lg:grid-cols-3 lg:gap-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col">
              <div className="flex items-center gap-4">
                <span className="num font-display text-4xl leading-none text-gold">{i + 1}</span>
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold leading-snug">{s.title}</h3>
              <p className="mt-2 max-w-sm text-[0.95rem] leading-relaxed text-muted-foreground">{s.body}</p>
              <div className="mt-6 max-w-sm" aria-hidden="true">{s.visual}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
