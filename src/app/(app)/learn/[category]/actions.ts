"use server";
import { getSession } from "@/lib/auth";
import { isLearningCategory } from "@/lib/categories";

export async function rememberCategory(category: string) {
  if (!isLearningCategory(category)) return;
  const s = await getSession();
  if (!s || s.profile.category === category) return;
  await s.supabase.from("profiles").update({ category }).eq("id", s.user.id);
}
