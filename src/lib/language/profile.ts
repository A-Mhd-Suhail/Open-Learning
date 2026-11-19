import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { MAX_KNOWN, PROFICIENCY, isLanguageLabel, type Proficiency } from "./languages";
import type { LanguageProfile } from "./types";

export const LANGUAGE_SETUP_PATH = "/learn/languages/setup";

/** The signed-in student's language profile, or null. Uses the RLS client. */
export const getLanguageProfile = cache(async (): Promise<LanguageProfile | null> => {
  const { supabase, user } = await requireSession();
  const { data } = await supabase.from("language_profiles").select("*").eq("user_id", user.id).maybeSingle<LanguageProfile>();
  return data ?? null;
});

/** Gate for every language route except /setup: no profile -> onboarding. */
export async function requireLanguageProfile() {
  const session = await requireSession();
  const profile = await getLanguageProfile();
  if (!profile) redirect(LANGUAGE_SETUP_PATH);
  return { ...session, languageProfile: profile };
}

const label = z.string().trim().refine(isLanguageLabel, "Enter a language name (2-40 characters).");

export const languageProfileSchema = z.object({
  target_language: label,
  known_languages: z.array(label).max(MAX_KNOWN, `Choose at most ${MAX_KNOWN} known languages.`),
  proficiency: z.enum(PROFICIENCY),
  discoverable: z.boolean(),
}).transform((v) => {
  const seen = new Set<string>();
  const known = v.known_languages.filter((l) => { const k = l.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  return { ...v, known_languages: known };
}).refine((v) => !v.known_languages.some((l) => l.toLowerCase() === v.target_language.toLowerCase()),
  { message: "Your target language cannot also be listed as a language you know.", path: ["known_languages"] });

export type LanguageProfileInput = { target_language: string; known_languages: string[]; proficiency: Proficiency; discoverable: boolean };

/** Parse + validate raw form data. Returns the clean input or a user-facing error. */
export function parseLanguageProfileForm(fd: FormData): { ok: true; value: LanguageProfileInput } | { ok: false; error: string } {
  const r = languageProfileSchema.safeParse({
    target_language: String(fd.get("target_language") ?? ""),
    known_languages: fd.getAll("known_languages").map(String),
    proficiency: String(fd.get("proficiency") ?? "beginner"),
    discoverable: fd.get("discoverable") === "on" || fd.get("discoverable") === "true",
  });
  if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? "Check your answers and try again." };
  return { ok: true, value: r.data };
}

/** Upsert the caller's own row under RLS. */
export async function saveLanguageProfile(input: LanguageProfileInput): Promise<{ error?: string }> {
  const { supabase, user } = await requireSession();
  // Not upsert(): PostgREST's upsert also rewrites user_id, which students (rightly) cannot UPDATE.
  const upd = await supabase.from("language_profiles").update(input).eq("user_id", user.id).select("user_id");
  if (upd.error) { console.error("language profile update failed", upd.error.message); return { error: "Could not save your language profile. Please try again." }; }
  if (upd.data && upd.data.length > 0) return {};
  const ins = await supabase.from("language_profiles").insert({ user_id: user.id, ...input });
  if (ins.error) { console.error("language profile insert failed", ins.error.message); return { error: "Could not save your language profile. Please try again." }; }
  return {};
}
