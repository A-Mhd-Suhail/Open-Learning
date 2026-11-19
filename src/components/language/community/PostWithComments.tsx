"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FeedPost, PostComment } from "@/lib/language/types";
import type { AuthorMap } from "./data";
import { PostCard } from "./PostCard";
import { Comments } from "./Comments";

export function PostWithComments({ post, comments, authors, urls, userId, category }: {
  post: FeedPost; comments: PostComment[]; authors: AuthorMap; urls: Record<string, string>; userId: string; category: string;
}) {
  const router = useRouter();
  const [count, setCount] = useState(comments.length);
  return (
    <div className="space-y-4">
      <PostCard post={post} author={authors[post.author_id]} urls={urls} userId={userId} category={category} commentCount={count}
        onDeleted={() => router.push(`/learn/${category}/community`)} />
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <h2 className="mb-3 text-base">Comments <span className="num text-muted-foreground">({count})</span></h2>
        <Comments postId={post.id} postAuthorId={post.author_id} userId={userId} initial={comments} initialAuthors={authors} onCountChange={setCount} />
      </div>
    </div>
  );
}
