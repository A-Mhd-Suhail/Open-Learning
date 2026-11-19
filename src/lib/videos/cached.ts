import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadAllVideos } from "./load";
import type { Exam, Video } from "./types";

export const VIDEOS_TAG = "videos";

/**
 * Video library for one exam, cached on the server and shared by all signed-in students.
 * The catalogue is identical for every student (RLS: any authenticated user may read it), so sharing it is safe.
 * The caller MUST have passed requireSession() first: this function does not authenticate anyone.
 * Admin video edits/imports invalidate the VIDEOS_TAG so changes show up immediately.
 */
export async function loadVideosCached(exam: Exam): Promise<{ videos: Video[]; error: string | null }> {
  "use cache";
  cacheTag(VIDEOS_TAG);
  cacheLife("hours");
  return loadAllVideos(createAdminClient(), exam);
}
