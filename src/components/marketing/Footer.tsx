import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="band-surface border-t border-accent/30 bg-band text-on-band">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-end">
        <div>
          <h2 className="max-w-xl text-4xl sm:text-5xl">Start with your name. Finish with your Student ID.</h2>
          <p className="mt-4 text-band-muted">Free to join. Sign in with Google.</p>
        </div>
        <ButtonLink href="/onboarding" size="lg" variant="accent">Get started</ButtonLink>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
          <Logo inverse />
          <p className="text-sm text-band-muted">Learn anything. Learn together. Grow together.</p>
        </div>
      </div>
    </footer>
  );
}
