import type { Proficiency } from "./languages";

/** Mirrors public.language_profiles */
export type LanguageProfile = {
  user_id: string; target_language: string; known_languages: string[]; proficiency: Proficiency;
  discoverable: boolean; created_at: string; updated_at: string;
};

/** Row returned by rpc("language_rooms", { p_type: "chat" | "voice", p_language? }) */
export type LanguageRoom = {
  id: string; type: "chat" | "voice"; name: string; language: string | null; description: string;
  visibility: "public" | "private"; max_participants: number | null; created_by: string | null;
  creator_name: string | null; creator_student_id: string | null; member_count: number; live_count: number;
  is_member: boolean; created_at: string;
};

/** Row returned by rpc("community_feed", { p_before?, p_limit?, p_language?, p_author? }) */
export type FeedPost = {
  id: string; author_id: string; body: string; visibility: "public" | "friends"; language: string | null;
  created_at: string; updated_at: string; like_count: number; comment_count: number; liked_by_me: boolean;
  /** storage paths in the private "community-media" bucket; render via signed URLs (see lib/language/media.ts) */
  images: string[];
};
export type PostComment = { id: string; post_id: string; author_id: string; body: string; created_at: string };
export type Story = { id: string; author_id: string; image_path: string; caption: string; created_at: string; expires_at: string };

export const MEDIA_BUCKET = "community-media";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_POST_IMAGES = 6;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
