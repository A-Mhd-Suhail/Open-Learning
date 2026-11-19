import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/button";

export function Footer() {
  return (
    <footer>
      <div className="bg-band text-on-band">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-end">
          <div>
            <h2 className="max-w-xl text-3xl sm:text-4xl">Start with your name. Finish with your Student ID.</h2>
            <p className="mt-3 text-band-muted">Free to join. Sign in with Google.</p>
          </div>
          <ButtonLink href="/onboarding" size="lg" variant="accent">Start Open Learning</ButtonLink>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
        <Logo />
        <p className="text-sm text-muted-foreground">Learn anything. Learn together. Grow together.</p>
      </div>
    </footer>
  );
}
