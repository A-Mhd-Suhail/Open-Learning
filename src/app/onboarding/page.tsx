import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { getSession } from "@/lib/auth";
import { ONBOARDING_ERRORS, isOnboarded, onboardingRedirect } from "@/lib/onboarding";
import { GoogleSignIn } from "./GoogleSignIn";

export const metadata: Metadata = { title: "Get started" };

async function Content({ searchParams }: { searchParams: PageProps<"/onboarding">["searchParams"] }) {
  const { error } = await searchParams;
  const session = await getSession();
  const to = onboardingRedirect({ signedIn: !!session, onboarded: session ? isOnboarded(session.profile) : false });
  if (to) redirect(to);
  const message = typeof error === "string" ? ONBOARDING_ERRORS[error] : undefined;
  return (
    <>
      {message && <p role="alert" className="mb-6 rounded-md border border-destructive/50 bg-card p-4 text-sm text-destructive">{message}</p>}
      <h1 className="text-3xl">Welcome to Open Learning</h1>
      <p className="mt-2 mb-8 text-muted-foreground">Continue with Google to create your account and get your permanent Student ID.</p>
      <GoogleSignIn />
    </>
  );
}

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <AuthShell step={1}>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" aria-hidden="true" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}
