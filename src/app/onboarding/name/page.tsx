import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { getSession } from "@/lib/auth";
import { isOnboarded, nameStepRedirect, suggestedName } from "@/lib/onboarding";
import { NameForm } from "./NameForm";

export const metadata: Metadata = { title: "Your name" };

async function Content() {
  const session = await getSession();
  const to = nameStepRedirect({ signedIn: !!session, onboarded: session ? isOnboarded(session.profile) : false });
  if (to || !session) redirect(to ?? "/onboarding");
  return <NameForm suggested={suggestedName(session.user.user_metadata, session.profile.display_name)} />;
}

export default function NamePage() {
  return (
    <AuthShell step={2}>
      <Suspense fallback={<div className="ol-skeleton h-64 rounded-lg" aria-hidden="true" />}>
        <Content />
      </Suspense>
    </AuthShell>
  );
}
