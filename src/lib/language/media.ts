import type { SupabaseClient } from "@supabase/supabase-js";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_POST_IMAGES } from "./types";

/** Client- and server-safe helpers for community images. No server-only imports. */

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

export const isImageType = (t: string) => (IMAGE_TYPES as readonly string[]).includes(t);
export const extFromMime = (t: string): string | null => EXT[t] ?? null;

export type FileLike = { type: string; size: number; name?: string };

/** Returns a human-readable problem, or null when the file is acceptable. */
export function validateImageFile(f: FileLike): string | null {
  const label = f.name ? `"${f.name}"` : "This file";
  if (!isImageType(f.type)) return `${label} is not a supported image. Use JPEG, PNG, WebP or GIF.`;
  if (f.size <= 0) return `${label} is empty.`;
  if (f.size > MAX_IMAGE_BYTES) return `${label} is larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`;
  return null;
}

/** Validates adding `incoming` to `existingCount` images. Splits into accepted files and error messages. */
export function validateImageBatch<T extends FileLike>(incoming: T[], existingCount = 0, max = MAX_POST_IMAGES) {
  const accepted: T[] = [];
  const errors: string[] = [];
  for (const f of incoming) {
    const problem = validateImageFile(f);
    if (problem) { errors.push(problem); continue; }
    if (existingCount + accepted.length >= max) {
      errors.push(`You can attach at most ${max} images. Extra files were skipped.`);
      break;
    }
    accepted.push(f);
  }
  return { accepted, errors };
}

/** Storage path for a new upload: `<uid>/<uuid>.<ext>`. */
export function mediaPath(uid: string, uuid: string, mime: string): string | null {
  const ext = extFromMime(mime);
  return ext ? `${uid}/${uuid}.${ext}` : null;
}

/** Mirrors the database rule: `<uid>/<file>` with a safe file name. */
export function isOwnedMediaPath(uid: string, path: string): boolean {
  if (!path.startsWith(`${uid}/`)) return false;
  return /^[A-Za-z0-9._-]{1,120}$/.test(path.slice(uid.length + 1)) && !path.includes("..");
}

type Signer = Pick<SupabaseClient, "storage">;

const SIGNED_SECONDS = 60 * 60;

/** Batch-signs private bucket paths (1 hour). Missing/unsigned paths are simply absent from the map. */
export async function signedUrlsFor(supabase: Signer, paths: string[], bucket = "community-media"): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return {};
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(unique, SIGNED_SECONDS);
  if (error || !data) return {};
  const out: Record<string, string> = {};
  for (const row of data) if (row.path && row.signedUrl) out[row.path] = row.signedUrl;
  return out;
}
