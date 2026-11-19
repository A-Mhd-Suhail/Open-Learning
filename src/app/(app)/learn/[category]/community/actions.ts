"use server";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { isLanguageCategory } from "@/lib/categories";
import { isLanguageLabel } from "@/lib/language/languages";
import { isOwnedMediaPath } from "@/lib/language/media";
import { MAX_POST_IMAGES, MEDIA_BUCKET } from "@/lib/language/types";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** RPC-raised validation messages (SQLSTATE P0001) are written for students; anything else stays generic. */
function friendly(error: { code?: string; message: string }, fallback: string) {
  return error.code === "P0001" || error.code === "42501" ? error.message : fallback;
}
const base = (category: string) => `/learn/${category}/community`;
function guard(category: string) { if (!isLanguageCategory(category)) notFound(); }

async function removeFiles(supabase: Awaited<ReturnType<typeof requireSession>>["supabase"], paths: string[]) {
  if (paths.length) await supabase.storage.from(MEDIA_BUCKET).remove(paths);
}

export async function createPostAction(category: string, input: { body: string; visibility: string; language: string | null; paths: string[] }): Promise<Result<{ id: string }>> {
  guard(category);
  const { supabase, user } = await requireSession();
  const paths = Array.isArray(input.paths) ? input.paths.filter((p) => typeof p === "string") : [];
  const fail = async (error: string): Promise<Result<{ id: string }>> => { await removeFiles(supabase, paths.filter((p) => isOwnedMediaPath(user.id, p))); return { ok: false, error }; };
  const body = String(input.body ?? "").trim();
  if (body.length > 2000) return fail("Posts can be at most 2000 characters.");
  if (paths.length > MAX_POST_IMAGES) return fail(`Attach at most ${MAX_POST_IMAGES} images.`);
  if (!paths.every((p) => isOwnedMediaPath(user.id, p))) return fail("Invalid image upload.");
  if (!body && paths.length === 0) return fail("Write something or add an image.");
  if (input.visibility !== "public" && input.visibility !== "friends") return fail("Choose who can see this post.");
  const language = input.language && input.language.trim() ? input.language.trim() : null;
  if (language && !isLanguageLabel(language)) return fail("Invalid language.");
  const { data, error } = await supabase.rpc("create_post", { p_body: body, p_visibility: input.visibility, p_language: language, p_paths: paths });
  if (error || !data) return fail(error ? friendly(error, "Could not publish your post.") : "Could not publish your post.");
  revalidatePath(base(category));
  return { ok: true, id: data as string };
}

export async function updatePostAction(category: string, id: string, body: string, visibility: string): Promise<Result> {
  guard(category);
  const { supabase } = await requireSession();
  if (visibility !== "public" && visibility !== "friends") return { ok: false, error: "Choose who can see this post." };
  const { error } = await supabase.rpc("update_post", { p_id: id, p_body: String(body ?? ""), p_visibility: visibility });
  if (error) return { ok: false, error: friendly(error, "Could not save your changes.") };
  revalidatePath(base(category));
  return { ok: true };
}

/** Removes the post's image files with the user's own client first (storage RLS allows only own folder), then the row. */
export async function deletePostAction(category: string, id: string): Promise<Result> {
  guard(category);
  const { supabase, user } = await requireSession();
  const { data: post } = await supabase.from("posts").select("id, author_id").eq("id", id).maybeSingle();
  if (!post) return { ok: false, error: "Post not found." };
  if (post.author_id !== user.id) return { ok: false, error: "You can only delete your own posts." };
  const { data: imgs } = await supabase.from("post_images").select("path").eq("post_id", id);
  const paths = (imgs ?? []).map((i: { path: string }) => i.path);
  if (paths.length) {
    const { error: rmErr } = await supabase.storage.from(MEDIA_BUCKET).remove(paths);
    if (rmErr) return { ok: false, error: "Could not delete the post's images. Nothing was deleted." };
  }
  const { error } = await supabase.from("posts").delete().eq("id", id).eq("author_id", user.id);
  if (error) return { ok: false, error: "Could not delete the post." };
  revalidatePath(base(category));
  return { ok: true };
}

export async function createStoryAction(category: string, path: string, caption: string): Promise<Result> {
  guard(category);
  const { supabase, user } = await requireSession();
  if (!isOwnedMediaPath(user.id, path)) return { ok: false, error: "Invalid image upload." };
  const cap = String(caption ?? "").trim().slice(0, 200);
  const { error } = await supabase.rpc("create_story", { p_path: path, p_caption: cap });
  if (error) { await removeFiles(supabase, [path]); return { ok: false, error: friendly(error, "Could not add your story.") }; }
  revalidatePath(base(category));
  return { ok: true };
}

export async function deleteStoryAction(category: string, id: string): Promise<Result> {
  guard(category);
  const { supabase, user } = await requireSession();
  const { data: s } = await supabase.from("stories").select("id, author_id, image_path").eq("id", id).maybeSingle();
  if (!s || s.author_id !== user.id) return { ok: false, error: "Story not found." };
  await supabase.storage.from(MEDIA_BUCKET).remove([s.image_path]);
  const { error } = await supabase.from("stories").delete().eq("id", id).eq("author_id", user.id);
  if (error) return { ok: false, error: "Could not delete the story." };
  revalidatePath(base(category));
  return { ok: true };
}
