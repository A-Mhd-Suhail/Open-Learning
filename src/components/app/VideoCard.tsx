import { ArrowUpRight, Play } from "lucide-react";
import type { Video } from "@/lib/videos/types";
import { thumbnailFor, watchUrlFor } from "@/lib/videos/youtube";

/** Old data may hold a YouTube search URL instead of a video: still safe to open, shown as "Find on YouTube". */
function searchUrlFor(input: string): string | null {
  try {
    const u = new URL(input.trim());
    if (u.protocol !== "https:" || !["youtube.com", "www.youtube.com", "m.youtube.com"].includes(u.hostname.toLowerCase())) return null;
    return u.pathname === "/results" && u.searchParams.get("search_query") ? u.toString() : null;
  } catch { return null; }
}

/**
 * One card, one link: the title anchor is stretched over the whole card (thumbnail, text and button),
 * so there is a single tab stop and a single accessible name. Server component, no client JS.
 */
export function VideoCard({ video, priority = false }: { video: Video; priority?: boolean }) {
  const watch = watchUrlFor(video.youtube_url); // never render a non-YouTube link
  const href = watch ?? searchUrlFor(video.youtube_url);
  const thumb = thumbnailFor(video.youtube_url, video.thumbnail_url);
  const trail = [video.subject, video.chapter].filter(Boolean).join(" · ");
  const tags = [video.class ? (/^\d+$/.test(video.class) ? `Class ${video.class}` : video.class) : null, video.year ? String(video.year) : null, video.language].filter(Boolean) as string[];
  const action = watch ? "Watch on YouTube" : "Find on YouTube";
  return (
    <article className="group relative flex h-full flex-col rounded-lg border border-border bg-card transition-colors duration-150 focus-within:border-accent hover:border-accent">
      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" width={480} height={360} loading={priority ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        )}
        <span aria-hidden="true" className="absolute bottom-2 left-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-band text-accent"><Play size={13} fill="currentColor" /></span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        {trail && <p className="line-clamp-1 text-xs font-semibold uppercase tracking-wide text-gold">{trail}</p>}
        <h3 className="mt-1.5 line-clamp-3 font-display text-base font-semibold leading-snug">
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${action}: ${video.title} (opens in a new tab)`} className="rounded-sm after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-offset-4">{video.title}</a>
          ) : video.title}
        </h3>
        {tags.length > 0 && <p className="num mt-2 line-clamp-1 text-xs text-muted-foreground">{tags.join(" · ")}</p>}
        <div className="mt-auto pt-4">
          {href ? (
            <span aria-hidden="true" className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-md border border-border text-sm font-semibold transition-colors duration-150 group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary">
              {action}<ArrowUpRight size={15} />
            </span>
          ) : <span className="inline-flex h-11 items-center text-sm text-muted-foreground">Link unavailable</span>}
        </div>
      </div>
    </article>
  );
}
