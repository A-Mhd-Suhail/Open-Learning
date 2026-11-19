"use client";
import { RotateCw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <Logo className="mb-12" />
      <p className="t-eyebrow">Error</p>
      <h1 className="t-h1 mt-3">Something went wrong</h1>
      <div className="foil mt-5" aria-hidden="true" />
      <p className="t-body mt-5 text-muted-foreground">An unexpected error occurred. Nothing you saved was lost. Try again, or head back to the start.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}><RotateCw size={16} aria-hidden="true" />Try again</Button>
        <ButtonLink href="/dashboard" variant="secondary">Go to dashboard</ButtonLink>
      </div>
    </main>
  );
}
