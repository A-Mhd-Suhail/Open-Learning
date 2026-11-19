"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isLanguageCategory } from "@/lib/categories";
import { parseLanguageProfileForm, saveLanguageProfile } from "@/lib/language/profile";

export type ProfileFormState = { error?: string };

export async function saveLanguageProfileAction(_prev: ProfileFormState, fd: FormData): Promise<ProfileFormState> {
  if (!isLanguageCategory(String(fd.get("category") ?? ""))) return { error: "Unknown category." };
  const parsed = parseLanguageProfileForm(fd);
  if (!parsed.ok) return { error: parsed.error };
  const res = await saveLanguageProfile(parsed.value);
  if (res.error) return res;
  revalidatePath("/learn/languages", "layout");
  redirect("/learn/languages");
}
