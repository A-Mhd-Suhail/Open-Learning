"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured, serviceRoleConfigured } from "@/lib/config";
import { parseDisplayName } from "@/lib/onboarding";

export type NameState = { error?: string; value?: string };

/** Saves the display name and completes onboarding. Student ID is never touched (DB trigger owns it). */
export async function saveName(_prev: NameState, formData: FormData): Promise<NameState> {
  const raw = formData.get("name");
  const value = typeof raw === "string" ? raw : "";
  const parsed = parseDisplayName(raw);
  if (!parsed.ok) return { error: parsed.error, value };
  if (!supabaseConfigured()) return { error: "The platform is not configured yet.", value };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); // verified with Supabase, never trusts the client
  if (!user) redirect("/onboarding");
  if (!serviceRoleConfigured()) return { error: "Saving is unavailable right now. Please contact the administrator.", value };

  // onboarded_at is service-role-only. `.is("onboarded_at", null)` makes a repeat/replayed submit a no-op,
  // so an already-onboarded student can never be renamed through this endpoint.
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ display_name: parsed.name, onboarded_at: new Date().toISOString() })
    .eq("id", user.id)
    .is("onboarded_at", null);
  if (error) return { error: "We could not save your name. Please try again.", value };
  redirect("/dashboard");
}
