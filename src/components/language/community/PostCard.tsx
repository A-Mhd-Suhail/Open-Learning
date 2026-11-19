"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Globe, Heart, Loader2, MessageCircle, Pencil, Share2, Trash2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { FeedPost } from "@/lib/language/types";
import { deletePostAction, updatePostAction } from "@/app/(app)/learn/[category]/community/actions";
import { fullDate, timeAgo, type Author } from "./data";

function Gallery({ paths, urls, onOpen }: { paths: string[]; urls: Record<string, string>; onOpen: (i: number) => void }) {
  const n = paths.length;
  if (n === 0) return null;
  const cols = n === 1 ? "grid-cols-1" : "grid-cols-2";
  return (
    <ul className={`mt-3 grid gap-1 overflow-hidden rounded-md ${cols}`}>
      {paths.map((p, i) => {
        const wide = n === 1 || (n === 3 && i === 0);
        return (
          <li key={p} className={`${wide ? (n === 1 ? "col-span-1 aspect-[4/3]" : "col-span-2 aspect-[2/1]") : "aspect-square"} relative bg-muted`}>
            {urls[p] ? (
              <button type="button" onClick={() => onOpen(i)} aria-label={`View image ${i + 1} of ${n}`} className="block h-full w-full cursor-zoom-in">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urls[p]} alt={`Post image ${i + 1} of ${n}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </button>
            ) : <span className="flex h-full items-center justify-center text-xs text-muted-foreground">Image unavailable</span>}
          </li>
        );
      })}
    </ul>
  );
}

export function PostCard({ post, author, urls, userId, category, commentCount: commentCountProp, onDeleted }: {
  post: FeedPost; author?: Author; urls: Record<string, string>; userId: string; category: string; commentCount?: number; onDeleted?: (id: string) => void;
}) {
  const commentCount = commentCountProp ?? post.comment_count;
  const mine = post.author_id === userId;
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.like_count);
  const likeBusy = useRef(false);
  const [body, setBody] = useState(post.body);
  const [visibility, setVisibility] = useState(post.visibility);
  const [edited, setEdited] = useState(new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 1000);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.body);
  const [draftVis, setDraftVis] = useState(post.visibility);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const link = `/learn/${category}/community/${post.id}`;

  async function toggleLike() {
    if (likeBusy.current) return;
    likeBusy.current = true;
    const next = !liked;
    setLiked(next); setLikes((n) => n + (next ? 1 : -1)); // optimistic
    const supabase = createClient();
    const { error: err } = next
      ? await supabase.from("post_likes").insert({ post_id: post.id, user_id: userId })
      : await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", userId);
    // 23505 = already liked (duplicate-safe via the primary key): the UI state is already correct.
    if (err && err.code !== "23505") { setLiked(!next); setLikes((n) => n + (next ? -1 : 1)); setError("Could not update your like."); }
    likeBusy.current = false;
  }

  async function share() {
    const url = `${window.location.origin}${link}`;
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; } catch {
      const ta = document.createElement("textarea");
      ta.value = url; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
    }
    if (ok) { setNote("Link copied"); setTimeout(() => setNote(""), 2500); } else window.prompt("Copy this link", url);
  }

  async function save() {
    setBusy(true); setError("");
    const res = await updatePostAction(category, post.id, draft, draftVis);
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    setBody(draft.trim()); setVisibility(draftVis); setEdited(true); setEditing(false);
  }

  async function remove() {
    setBusy(true); setError("");
    const res = await deletePostAction(category, post.id);
    setBusy(false);
    if (!res.ok) { setError(res.error); setConfirmDelete(false); return; }
    setConfirmDelete(false);
    onDeleted?.(post.id);
  }

  const act = "inline-flex h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground";
  const name = author?.display_name ?? "Student";
  return (
    <article className="rounded-lg border border-border bg-card p-4 sm:p-5" aria-label={`Post by ${name}`}>
      <header className="flex items-start gap-3">
        <Avatar name={name} src={author?.avatar_url ?? null} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{name}</p>
          <p className="text-xs text-muted-foreground">
            {author && <span className="num">{author.student_id} · </span>}
            <Link href={link} className="hover:underline"><time dateTime={post.created_at} title={fullDate(post.created_at)}>{timeAgo(post.created_at)}</time></Link>
            {edited ? " · edited" : ""}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">{visibility === "public" ? <Globe size={12} aria-hidden="true" /> : <Users size={12} aria-hidden="true" />}{visibility === "public" ? "Public" : "Friends"}</span>
            {post.language && <span className="rounded-sm bg-muted px-1.5 py-0.5 font-medium text-foreground">{post.language}</span>}
          </p>
        </div>
        {mine && !editing && (
          <div className="flex shrink-0">
            <button type="button" className={act} aria-label="Edit post" onClick={() => { setDraft(body); setDraftVis(visibility); setEditing(true); }}><Pencil size={16} aria-hidden="true" /></button>
            <button type="button" className={`${act} hover:text-destructive`} aria-label="Delete post" onClick={() => setConfirmDelete(true)}><Trash2 size={16} aria-hidden="true" /></button>
          </div>
        )}
      </header>

      {editing ? (
        <div className="mt-3 space-y-3">
          <label htmlFor={`e-${post.id}`} className="sr-only">Edit post text</label>
          <textarea id={`e-${post.id}`} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={2000} rows={5} className="w-full rounded-md border border-border bg-card px-3 py-2.5" />
          <label htmlFor={`v-${post.id}`} className="sr-only">Visibility</label>
          <select id={`v-${post.id}`} value={draftVis} onChange={(e) => setDraftVis(e.target.value as "public" | "friends")} className="h-11 w-full rounded-md border border-border bg-card px-3 sm:w-auto">
            <option value="public">Everyone in Language Learning</option><option value="friends">Friends only</option>
          </select>
          <div className="flex gap-2">
            <Button size="md" onClick={save} disabled={busy}>{busy && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />} Save</Button>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      ) : body && <p className="mt-3 whitespace-pre-wrap">{body}</p>}

      <Gallery paths={post.images} urls={urls} onOpen={setLightbox} />

      <footer className="mt-3 flex items-center gap-1 border-t border-border pt-2">
        <button type="button" onClick={toggleLike} aria-pressed={liked} aria-label={`${liked ? "Unlike" : "Like"} (${likes})`} className={`${act} ${liked ? "text-primary" : ""}`}>
          <Heart size={18} aria-hidden="true" fill={liked ? "currentColor" : "none"} /> <span className="num">{likes}</span>
        </button>
        <Link href={link} className={act} aria-label={`Comments (${post.comment_count})`}>
          <MessageCircle size={18} aria-hidden="true" /> <span className="num">{commentCount}</span>
        </Link>
        <button type="button" onClick={share} className={act} aria-label="Copy link to this post"><Share2 size={18} aria-hidden="true" /> <span className="hidden sm:inline">Share</span></button>
        <span role="status" aria-live="polite" className="ml-1 text-xs text-success">{note}</span>
      </footer>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}

      <Dialog open={confirmDelete} onClose={() => !busy && setConfirmDelete(false)} title="Delete this post?">
        <p className="text-sm text-muted-foreground">This removes the post, its images, likes and comments. It cannot be undone.</p>
        <div className="mt-4 flex gap-2">
          <Button onClick={remove} disabled={busy} className="bg-destructive text-white hover:bg-destructive/90">{busy && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />} Delete post</Button>
          <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={busy}>Cancel</Button>
        </div>
      </Dialog>
      <Dialog open={lightbox !== null} onClose={() => setLightbox(null)} title={`Image ${(lightbox ?? 0) + 1} of ${post.images.length}`}>
        {lightbox !== null && urls[post.images[lightbox]] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urls[post.images[lightbox]]} alt={`Post image ${lightbox + 1} of ${post.images.length}`} className="mx-auto max-h-[70vh] w-auto max-w-full rounded-md object-contain" />
        )}
        {post.images.length > 1 && lightbox !== null && (
          <div className="mt-3 flex justify-between">
            <Button variant="secondary" disabled={lightbox === 0} onClick={() => setLightbox(lightbox - 1)}>Previous</Button>
            <Button variant="secondary" disabled={lightbox === post.images.length - 1} onClick={() => setLightbox(lightbox + 1)}>Next</Button>
          </div>
        )}
      </Dialog>
    </article>
  );
}
