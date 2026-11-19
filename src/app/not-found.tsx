import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <Logo className="mb-12" />
      <p className="t-eyebrow">404</p>
      <h1 className="t-h1 mt-3">Page not found</h1>
      <div className="foil mt-5" aria-hidden="true" />
      <p className="t-body mt-5 text-muted-foreground">The page you are looking for does not exist, or you do not have access to it.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/dashboard">Go to dashboard</ButtonLink>
        <ButtonLink href="/" variant="secondary">Home</ButtonLink>
      </div>
    </main>
  );
}
