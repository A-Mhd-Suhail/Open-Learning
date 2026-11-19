"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { mediaPath, validateImageFile } from "@/lib/language/media";
import { MEDIA_BUCKET } from "@/lib/language/types";
import { createStoryAction, deleteStoryAction } from "@/app/(app)/learn/[category]/community/actions";
import { timeAgo, timeLeft, type AuthorMap, type StoryWithUrl } from "./data";

export function StoriesStrip({ category, userId, stories, authors }: { category: string; userId: string; stories: StoryWithUrl[]; authors: AuthorMap }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<{ author: string; index: number } | null>(null);
  const [draft, setDraft] = useState<{ file: File; preview: string } | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t); }, []);

  // Group by author, own stories first, newest author-activity next.
  const groups = useMemo(() => {
    const m = new Map<string, StoryWithUrl[]>();
    for (const s of stories.filter((s) => new Date(s.expires_at).getTime() > now)) m.set(s.author_id, [...(m.get(s.author_id) ?? []), s]);
    const list = [...m.entries()].map(([author, items]) => ({ author, items: items.sort((a, b) => a.created_at.localeCompare(b.created_at)) }));
    return list.sort((a, b) => (a.author === userId ? -1 : b.author === userId ? 1 : b.items[b.items.length - 1].created_at.localeCompare(a.items[a.items.length - 1].created_at)));
  }, [stories, now, userId]);
  const myCount = groups.find((g) => g.author === userId)?.items.length ?? 0;

  function pick(list: FileList | null) {
    const f = list?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!f) return;
    const problem = validateImageFile(f);
    if (problem) { setError(problem); return; }
    if (myCount >= 10) { setError("You already have 10 active stories. Delete one or wait for it to expire."); return; }
    setError(""); setCaption(""); setDraft({ file: f, preview: URL.createObjectURL(f) });
  }
  function closeDraft() { if (draft) URL.revokeObjectURL(draft.preview); setDraft(null); }

  async function publish() {
    if (!draft || busy) return;
    setBusy(true); setError("");
    const supabase = createClient();
    const path = mediaPath(userId, crypto.randomUUID(), draft.file.type);
    if (!path) { setError("Unsupported image type."); setBusy(false); return; }
    const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, draft.file, { contentType: draft.file.type, upsert: false });
    if (upErr) { setError("Could not upload the image. Please try again."); setBusy(false); return; }
    const res = await createStoryAction(category, path, caption); // removes the file itself if the RPC rejects
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    closeDraft(); router.refresh();
  }

  async function removeStory(id: string) {
    setBusy(true);
    const res = await deleteStoryAction(category, id);
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    setView(null); router.refresh();
  }

  const group = view ? groups.find((g) => g.author === view.author) : null;
  const current = group && view ? group.items[view.index] : null;
  const curAuthor = current ? authors[current.author_id] : null;
  const tile = "flex w-[72px] shrink-0 cursor-pointer flex-col items-center gap-1.5 rounded-md py-1 text-center";

  return (
    <section aria-label="Stories" className="rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base">Stories</h2>
        <p className="text-xs text-muted-foreground">Stories disappear after 24 hours</p>
      </div>
      <ul className="mt-3 flex gap-3 overflow-x-auto pb-1" role="list">
        <li>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(e) => pick(e.target.files)} aria-label="Choose a story image" />
          <button type="button" onClick={() => fileRef.current?.click()} className={tile} aria-label="Add story">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary text-primary"><Plus size={22} aria-hidden="true" /></span>
            <span className="w-full truncate text-xs font-medium">Add story</span>
          </button>
        </li>
        {groups.map((g) => {
          const a = authors[g.author];
          const first = g.items[g.items.length - 1];
          return (
            <li key={g.author}>
              <button type="button" onClick={() => setView({ author: g.author, index: 0 })} className={tile} aria-label={`View ${g.author === userId ? "your" : `${a?.display_name ?? "student"}'s`} stories, ${g.items.length}`}>
                <span className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-primary bg-muted">
                  {first.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={first.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : <Avatar name={a?.display_name ?? "Student"} src={a?.avatar_url ?? null} size="lg" />}
                </span>
                <span className="w-full truncate text-xs font-medium">{g.author === userId ? "Your story" : a?.display_name ?? "Student"}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {error && !draft && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}

      <Dialog open={!!draft} onClose={() => !busy && closeDraft()} title="Add a story">
        {draft && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.preview} alt="Story preview" className="mx-auto max-h-[50vh] w-auto max-w-full rounded-md object-contain" />
            <div>
              <label htmlFor="story-caption" className="mb-1 block text-sm font-semibold">Caption <span className="font-normal text-muted-foreground">(optional)</span></label>
              <input id="story-caption" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={200} className="h-11 w-full rounded-md border border-border bg-card px-3" />
            </div>
            <p className="text-xs text-muted-foreground">Everyone in Language Learning can see this. It disappears after 24 hours.</p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={publish} disabled={busy}>{busy && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />} Share story</Button>
              <Button variant="ghost" onClick={closeDraft} disabled={busy}>Cancel</Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={!!current} onClose={() => setView(null)} title={curAuthor ? `${curAuthor.display_name}'s story` : "Story"}>
        {current && group && view && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={curAuthor?.display_name ?? "Student"} src={curAuthor?.avatar_url ?? null} size="sm" />
              <p className="min-w-0 flex-1 text-sm"><span className="font-semibold">{curAuthor?.display_name ?? "Student"}</span><br />
                <span className="text-xs text-muted-foreground">{timeAgo(current.created_at, now)} · {timeLeft(current.expires_at, now)}</span></p>
              {current.author_id === userId && (
                <Button variant="ghost" onClick={() => removeStory(current.id)} disabled={busy} aria-label="Delete this story"><Trash2 size={16} aria-hidden="true" /> Delete</Button>
              )}
            </div>
            {current.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.url} alt={current.caption || `Story by ${curAuthor?.display_name ?? "a student"}`} className="mx-auto max-h-[60vh] w-auto max-w-full rounded-md object-contain" />
            ) : <p className="py-10 text-center text-sm text-muted-foreground">Image unavailable</p>}
            {current.caption && <p className="text-sm">{current.caption}</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {group.items.length > 1 && (
              <div className="flex items-center justify-between">
                <Button variant="secondary" disabled={view.index === 0} onClick={() => setView({ ...view, index: view.index - 1 })} aria-label="Previous story"><ChevronLeft size={18} aria-hidden="true" /></Button>
                <span className="num text-sm text-muted-foreground">{view.index + 1} / {group.items.length}</span>
                <Button variant="secondary" disabled={view.index === group.items.length - 1} onClick={() => setView({ ...view, index: view.index + 1 })} aria-label="Next story"><ChevronRight size={18} aria-hidden="true" /></Button>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </section>
  );
}
