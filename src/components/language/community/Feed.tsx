"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2, MessageSquareText, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ALL_LANGUAGES } from "@/lib/language/languages";
import type { FeedPost } from "@/lib/language/types";
import { loadFeedPage, type AuthorMap } from "./data";
import { PostCard } from "./PostCard";

export function Feed({ category, userId, initialPosts, initialAuthors, initialUrls, initialHasMore, initialLanguage, initialError }: {
  category: string; userId: string; initialPosts: FeedPost[]; initialAuthors: AuthorMap; initialUrls: Record<string, string>;
  initialHasMore: boolean; initialLanguage: string; initialError?: string;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [authors, setAuthors] = useState(initialAuthors);
  const [urls, setUrls] = useState(initialUrls);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [language, setLanguage] = useState(initialLanguage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError ?? "");

  async function fetchPage(reset: boolean, lang: string) {
    setLoading(true); setError("");
    const before = reset ? null : posts[posts.length - 1]?.created_at ?? null;
    const page = await loadFeedPage(createClient(), { before, language: lang || null });
    setLoading(false);
    if (page.error) { setError(page.error); return; }
    setPosts((cur) => reset ? page.posts : [...cur, ...page.posts.filter((p) => !cur.some((c) => c.id === p.id))]);
    setAuthors((cur) => ({ ...cur, ...page.authors })); setUrls((cur) => ({ ...cur, ...page.urls })); setHasMore(page.hasMore);
  }

  function changeLanguage(lang: string) { setLanguage(lang); setPosts([]); void fetchPage(true, lang); }

  return (
    <section aria-label="Posts" className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="feed-lang" className="text-sm font-semibold">Language</label>
        <select id="feed-lang" value={language} onChange={(e) => changeLanguage(e.target.value)} className="h-11 max-w-full rounded-md border border-border bg-card px-3">
          <option value="">All languages</option>
          {ALL_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/40 p-3 text-sm text-destructive">{error}<Button variant="secondary" onClick={() => fetchPage(posts.length === 0, language)}>Try again</Button></div>}

      {posts.length === 0 && !loading && !error && (
        <EmptyState icon={MessageSquareText} title={language ? `No ${language} posts yet` : "No posts yet"} description="Be the first to share something you are learning."
          action={<Link href={`/learn/${category}/community/new`} className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"><Plus size={18} aria-hidden="true" /> Create post</Link>} />
      )}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} author={authors[p.author_id]} urls={urls} userId={userId} category={category}
          onDeleted={(id) => setPosts((cur) => cur.filter((x) => x.id !== id))} />
      ))}
      {loading && <div role="status" className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Loading posts...</div>}
      {hasMore && !loading && posts.length > 0 && <div className="flex justify-center"><Button variant="secondary" onClick={() => fetchPage(false, language)}>Load more</Button></div>}
    </section>
  );
}
