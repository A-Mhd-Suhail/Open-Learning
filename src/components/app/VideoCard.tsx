import { Play } from "lucide-react";
import type { Video } from "@/lib/videos/types";
import { thumbnailFor, watchUrlFor } from "@/lib/videos/youtube";

export function VideoCard({ video }: { video: Video }) {
  const safe = watchUrlFor(video.youtube_url); // never render a non-YouTube link
  const thumb = thumbnailFor(video.youtube_url, video.thumbnail_url);
  const path = [video.subject, video.chapter, video.topic].filter(Boolean) as string[];
  const meta = [video.exam, video.class ? `Class ${video.class}` : null, video.year ? String(video.year) : null, video.language].filter(Boolean) as string[];
  return (
    <article className="group flex h-full flex-col">
      <a href={safe ?? undefined} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" className="relative block aspect-video overflow-hidden rounded-md border border-border bg-muted">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none" />
        )}
        <span className="absolute bottom-2 left-2 inline-flex h-8 w-8 items-center justify-center rounded bg-band text-accent"><Play size={13} fill="currentColor" aria-hidden="true" /></span>
      </a>
      <div className="flex flex-1 flex-col pt-3">
        <p className="num text-xs font-semibold text-muted-foreground">{meta.join("  ·  ")}</p>
        <h3 className="mt-1 line-clamp-2 font-display text-[1.05rem] font-semibold leading-snug">{safe ? <a href={safe} target="_blank" rel="noopener noreferrer" className="hover:underline">{video.title}</a> : video.title}</h3>
        {path.length > 0 && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{path.join(" / ")}</p>}
        <div className="mt-auto pt-4">
          {safe ? (
            <a href={safe} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${video.title} on YouTube (opens in a new tab)`}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-border text-sm font-semibold transition-colors hover:border-primary hover:bg-primary hover:text-on-primary">
              Watch on YouTube
            </a>
          ) : <span className="text-sm text-muted-foreground">Link unavailable</span>}
        </div>
      </div>
    </article>
  );
}
