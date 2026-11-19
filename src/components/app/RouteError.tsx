"use client";
import Link from "next/link";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";

/**
 * Error boundary body for a route group. Renders inside the app shell (the shell and navigation stay usable),
 * says what happened in plain words and offers a retry plus a way out to the parent page.
 */
export function RouteError({ error, reset, title = "This page could not load", backHref, backLabel = "Go back" }: {
  error: Error & { digest?: string }; reset: () => void; title?: string; backHref: string; backLabel?: string;
}) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center rounded-lg border border-border bg-card px-5 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-destructive"><TriangleAlert size={22} strokeWidth={1.75} aria-hidden="true" /></span>
      <h1 className="mt-4 text-xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our side. Your data is safe. Try again, or head back.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href={backHref} className={buttonVariants({ variant: "secondary" })}>{backLabel}</Link>
      </div>
    </div>
  );
}
