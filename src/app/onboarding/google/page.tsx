import { redirect } from "next/navigation";

/** Legacy step-2 URL from the old name-first flow. Google is now the first step. */
export default function LegacyGooglePage() {
  redirect("/onboarding");
}
