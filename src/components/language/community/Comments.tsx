"use client";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { PostComment } from "@/lib/language/types";
import { fullDate, loadAuthors, timeAgo, type AuthorMap } from "./data";

export function Comments({ postId, postAuthorId, userId, initial, initialAuthors, onCountChange }: {
  postId: string; postAuthorId: string; userId: string; initial: PostComment[]; initialAuthors: AuthorMap; onCountChange?: (n: number) => void;
}) {
  const [items, setItems] = useState(initial);
  const [authors, setAuthors] = useState(initialAuthors);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    if (body.length > 1000) { setError("Comments can be at most 1000 characters."); return; }
    setBusy(true); setError("");
    const supabase = createClient();
    const { data, error: err } = await supabase.from("post_comments").insert({ post_id: postId, author_id: userId, body }).select("id, post_id, author_id, body, created_at").single();
    if (err || !data) { setError("Could not post your comment."); setBusy(false); return; }
    const next = [...items, data as PostComment];
    setItems(next); setText(""); setBusy(false); onCountChange?.(next.length);
    if (!authors[userId]) setAuthors(await loadAuthors(supabase, [userId]).then((a) => ({ ...authors, ...a })));
  }

  async function remove(id: string) {
    const { error: err } = await createClient().from("post_comments").delete().eq("id", id);
    if (err) { setError("Could not delete the comment."); return; }
    const next = items.filter((c) => c.id !== id);
    setItems(next); onCountChange?.(next.length);
  }

  return (
    <section aria-label="Comments" className="space-y-4">
      {items.length === 0 ? <p className="text-sm text-muted-foreground">No comments yet. Be the first to reply.</p> : (
        <ul className="space-y-3">
          {items.map((c) => {
            const a = authors[c.author_id];
            const canDelete = c.author_id === userId || postAuthorId === userId;
            return (
              <li key={c.id} className="flex gap-3">
                <Avatar name={a?.display_name ?? "Student"} src={a?.avatar_url ?? null} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm"><span className="font-semibold">{a?.display_name ?? "Student"}</span>{" "}
                    {a && <span className="num text-xs text-muted-foreground">{a.student_id}</span>}{" "}
                    <time dateTime={c.created_at} title={fullDate(c.created_at)} className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</time></p>
                  <p className="whitespace-pre-wrap text-sm">{c.body}</p>
                </div>
                {canDelete && (
                  <button type="button" onClick={() => remove(c.id)} aria-label="Delete comment"
                    className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive">
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <label htmlFor={`c-${postId}`} className="sr-only">Add a comment</label>
          <input id={`c-${postId}`} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Add a comment..."
            className="h-11 w-full rounded-md border border-border bg-card px-3" />
        </div>
        <Button type="submit" variant="secondary" disabled={busy || !text.trim()}>{busy ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null} Comment</Button>
      </form>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
