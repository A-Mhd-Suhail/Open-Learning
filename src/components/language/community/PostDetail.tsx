import "server-only";
import { notFound } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedPost, PostComment } from "@/lib/language/types";
import { signedUrlsFor } from "@/lib/language/media";
import { loadAuthors } from "./data";
import { PostWithComments } from "./PostWithComments";

/** Server component: loads one post, its comments and image URLs with the viewer's RLS client; 404s when hidden. */
export async function PostDetail({ supabase, postId, userId, category }: { supabase: SupabaseClient; postId: string; userId: string; category: string }) {
  const { data: p } = await supabase.from("posts").select("id, author_id, body, visibility, language, created_at, updated_at").eq("id", postId).maybeSingle();
  if (!p) notFound();
  const [imgs, likes, mine, comments] = await Promise.all([
    supabase.from("post_images").select("path").eq("post_id", postId).order("position"),
    supabase.from("post_likes").select("post_id", { count: "exact", head: true }).eq("post_id", postId),
    supabase.from("post_likes").select("post_id").eq("post_id", postId).eq("user_id", userId).maybeSingle(),
    supabase.from("post_comments").select("id, post_id, author_id, body, created_at").eq("post_id", postId).order("created_at").limit(500),
  ]);
  const cs = (comments.data ?? []) as PostComment[];
  const post: FeedPost = { ...p, like_count: likes.count ?? 0, comment_count: cs.length, liked_by_me: !!mine.data, images: (imgs.data ?? []).map((i: { path: string }) => i.path) } as FeedPost;
  const [authors, urls] = await Promise.all([loadAuthors(supabase, [p.author_id, ...cs.map((c) => c.author_id)]), signedUrlsFor(supabase, post.images)]);
  return <PostWithComments post={post} comments={cs} authors={authors} urls={urls} userId={userId} category={category} />;
}
