import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/config";
import { callbackErrorFromParams, isOnboarded, postAuthDestination } from "@/lib/onboarding";

/**
 * Google OAuth return. Routes by the verified profile, not by anything the client sent:
 * cancelled/failed -> /onboarding with a message; completed profile -> dashboard (or safe `next`);
 * new student -> the name step.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const go = (path: string) => NextResponse.redirect(`${origin}${path}`);
  if (!supabaseConfigured()) return go("/onboarding?error=not_configured");

  const providerError = callbackErrorFromParams(searchParams);
  if (providerError) return go(`/onboarding?error=${providerError}`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(searchParams.get("code")!);
  if (error) return go("/onboarding?error=auth_failed");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return go("/onboarding?error=auth_failed");

  // RLS lets a student read their own row; the profile is created by the DB trigger at first sign-in.
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) return go("/onboarding?error=auth_failed");
  return go(postAuthDestination(isOnboarded(profile), searchParams.get("next")));
}
