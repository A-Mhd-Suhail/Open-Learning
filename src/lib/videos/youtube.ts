const HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"]);
const ID = /^[A-Za-z0-9_-]{11}$/;

/** Returns the 11-char video id for a valid YouTube watch/short/embed URL, else null. HTTPS only. */
export function parseYoutubeId(input: string): string | null {
  let u: URL;
  try { u = new URL(input.trim()); } catch { return null; }
  if (u.protocol !== "https:" || !HOSTS.has(u.hostname.toLowerCase())) return null;
  let id: string | null = null;
  if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1).split("/")[0];
  else if (u.pathname === "/watch") id = u.searchParams.get("v");
  else {
    const m = u.pathname.match(/^\/(embed|shorts|live)\/([^/]+)/);
    if (m) id = m[2];
  }
  return id && ID.test(id) ? id : null;
}

export function thumbnailFor(youtubeUrl: string, explicit?: string | null): string | null {
  if (explicit && /^https:\/\//i.test(explicit)) return explicit;
  const id = parseYoutubeId(youtubeUrl);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/** True only for a direct video URL (watch?v= / youtu.be / embed / shorts / live). Search, playlist and channel URLs are not. */
export function isYoutubeLink(input: string): boolean {
  return parseYoutubeId(input) !== null;
}

/** The canonical https://www.youtube.com/watch?v=ID for a direct video URL, else null. */
export function watchUrlFor(input: string): string | null {
  const id = parseYoutubeId(input);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}
