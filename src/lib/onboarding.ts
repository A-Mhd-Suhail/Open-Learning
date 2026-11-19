import { z } from "zod";

/**
 * Pure onboarding logic (no server-only imports) so it can be unit tested.
 * Flow: Google sign-in first, then a one-time name step. "Completed" means profiles.onboarded_at is set,
 * which only the service role can write (column grants + guard trigger).
 */

/** Matches the DB check on profiles.display_name (2-50 chars). */
export const NAME_MIN = 2;
export const NAME_MAX = 50;

export const displayNameSchema = z
  .string()
  .transform((s) => s.normalize("NFC").replace(/\s+/g, " ").trim())
  .pipe(
    z
      .string()
      .min(NAME_MIN, `Please enter at least ${NAME_MIN} characters.`)
      .max(NAME_MAX, `Please keep your name to ${NAME_MAX} characters or fewer.`)
      .refine((s) => !/[\p{Cc}\p{Cf}<>]/u.test(s), "That name contains characters we cannot use."),
  );

export function parseDisplayName(raw: unknown): { ok: true; name: string } | { ok: false; error: string } {
  if (typeof raw !== "string") return { ok: false, error: "Please enter your name." };
  const r = displayNameSchema.safeParse(raw);
  return r.success ? { ok: true, name: r.data } : { ok: false, error: r.error.issues[0]?.message ?? "Invalid name." };
}

/**
 * A profile is complete once onboarded_at is set. `undefined` means the column does not exist
 * (migration 0003 not applied yet): treat as complete so nobody is locked out of an older database.
 */
export function isOnboarded(profile: { onboarded_at?: string | null }): boolean {
  return profile.onboarded_at === undefined ? true : profile.onboarded_at !== null;
}

export type OnboardingState = { signedIn: boolean; onboarded: boolean };

/** Where /onboarding (the Google screen) should send a visitor. null = show the Google screen. */
export function onboardingRedirect(s: OnboardingState): "/dashboard" | "/onboarding/name" | null {
  if (!s.signedIn) return null;
  return s.onboarded ? "/dashboard" : "/onboarding/name";
}

/** Where the name step should send a visitor. null = show the name form. */
export function nameStepRedirect(s: OnboardingState): "/onboarding" | "/dashboard" | null {
  if (!s.signedIn) return "/onboarding";
  return s.onboarded ? "/dashboard" : null;
}

/** Same-site relative paths only (prevents open redirects). */
export function safeNext(raw: string | null | undefined): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\") ? raw : "/dashboard";
}

export type CallbackErrorCode = "auth_cancelled" | "auth_failed" | "not_configured";

export const ONBOARDING_ERRORS: Record<string, string> = {
  not_configured: "The platform is not configured yet (missing Supabase environment variables).",
  auth_cancelled: "Google sign-in was cancelled. You can try again whenever you are ready.",
  auth_failed: "We could not complete Google sign-in. Please try again.",
};

/** Maps OAuth error query params (or a missing code) from the provider/Supabase to an error code, or null if none. */
export function callbackErrorFromParams(p: { get(name: string): string | null }): CallbackErrorCode | null {
  const err = p.get("error") ?? p.get("error_code");
  if (err) {
    const desc = (p.get("error_description") ?? "").toLowerCase();
    return err === "access_denied" || desc.includes("access_denied") || desc.includes("denied") || desc.includes("cancel")
      ? "auth_cancelled"
      : "auth_failed";
  }
  return p.get("code") ? null : "auth_failed";
}

/** Where the OAuth callback sends a freshly authenticated user. */
export function postAuthDestination(onboarded: boolean, next: string | null | undefined): string {
  return onboarded ? safeNext(next) : "/onboarding/name";
}

/** Prefill for the name step: Google full name if usable, else the profile's current display name. */
export function suggestedName(meta: Record<string, unknown> | undefined, fallback: string): string {
  for (const k of ["full_name", "name"]) {
    const v = meta?.[k];
    if (typeof v === "string") {
      const r = parseDisplayName(v.length > NAME_MAX ? v.slice(0, NAME_MAX) : v);
      if (r.ok) return r.name;
    }
  }
  return fallback;
}
