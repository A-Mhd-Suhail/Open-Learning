"use server";
import { revalidatePath, updateTag } from "next/cache";
import { VIDEOS_TAG } from "@/lib/videos/cached";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { toDbRow, validateRows, type RawRow } from "@/lib/videos/validate";

export type FormState = { error?: string };

function rowFrom(fd: FormData): RawRow {
  const g = (k: string) => String(fd.get(k) ?? "").trim();
  return { "Video ID": g("video_id"), Exam: g("exam"), Class: g("class"), Subject: g("subject"), Chapter: g("chapter"), Topic: g("topic"), Year: g("year"),
    "Video Title": g("title"), "YouTube Link": g("youtube_url"), "Thumbnail URL": g("thumbnail_url"), Description: g("description"), Language: g("language") };
}

export async function saveVideo(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const r = validateRows([rowFrom(fd)], new Set());
  if (r.issues.length) return { error: r.issues[0].problems.join(" · ") };
  const v = toDbRow(r.valid[0]);
  const q = id ? supabase.from("videos").update({ ...v, updated_at: new Date().toISOString() }).eq("id", id) : supabase.from("videos").insert(v);
  const { error } = await q;
  if (error) return { error: error.code === "23505" ? "A video with this Video ID already exists." : "Could not save the video." };
  updateTag(VIDEOS_TAG); revalidatePath("/admin/videos"); revalidatePath("/learn", "layout");
  redirect("/admin/videos");
}

export async function deleteVideo(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  await supabase.from("videos").delete().eq("id", id);
  updateTag(VIDEOS_TAG); revalidatePath("/admin/videos"); revalidatePath("/learn", "layout");
}
