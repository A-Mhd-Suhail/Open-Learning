"use client";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-3xl">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">An unexpected error occurred. Your data is safe. Please try again.</p>
      <Button className="mt-6 self-start" onClick={reset}>Try again</Button>
    </main>
  );
}
