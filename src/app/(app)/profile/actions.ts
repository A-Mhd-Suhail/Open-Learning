"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { normalizeName, validateName } from "@/lib/validation";

export async function updateDisplayName(raw: string): Promise<{ error?: string }> {
  const error = validateName(raw);
  if (error) return { error };
  const { supabase, user } = await requireSession();
  // Runs as the student: column grants + RLS only permit display_name/avatar_url/category on own row.
  const { error: dbError } = await supabase.from("profiles").update({ display_name: normalizeName(raw) }).eq("id", user.id);
  if (dbError) return { error: "Could not save your name. Please try again." };
  revalidatePath("/", "layout");
  return {};
}
