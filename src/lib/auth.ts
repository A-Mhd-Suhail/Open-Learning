import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { supabaseConfigured } from "@/lib/config";
import { isOnboarded } from "@/lib/onboarding";

/** Verified user + profile for this request (cached per request). */
export const getSession = cache(async () => {
  if (!supabaseConfigured()) return null;
  await connection(); // session is request-time data; keeps token-expiry clock reads out of prerender
  const supabase = await createClient();
  // The signature-checked claims give the user id locally (no network), so the profile query can run at the same
  // time as the server-side user verification instead of after it: one database round trip saved on every request.
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return null;
  const [{ data: { user } }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(), // still verifies with Supabase, not just the cookie
    supabase.from("profiles").select("*").eq("id", uid).single<Profile>(),
  ]);
  if (!user || user.id !== uid || !profile) return null;
  return { user, profile, supabase };
});

export async function requireSession() {
  const s = await getSession();
  if (!s) redirect("/onboarding");
  // Signed in with Google but name step not finished: enforced here, server-side, for every (app) page and action.
  if (!isOnboarded(s.profile)) redirect("/onboarding/name");
  return s;
}

/** Server-side admin gate. Non-admins get a 404 so admin routes are not discoverable. */
export async function requireAdmin() {
  const s = await requireSession();
  if (s.profile.role !== "admin") notFound();
  return s;
}
