"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ALL_LANGUAGES } from "@/lib/language/languages";
import { mediaPath, validateImageBatch } from "@/lib/language/media";
import { MAX_POST_IMAGES, MEDIA_BUCKET } from "@/lib/language/types";
import { createPostAction } from "@/app/(app)/learn/[category]/community/actions";

type Picked = { key: string; file: File; preview: string };
const MAX_BODY = 2000;

export function CreatePostForm({ category, defaultLanguage, userId }: { category: string; defaultLanguage?: string | null; userId: string }) {
  const router = useRouter();
  const uid = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"public" | "friends">("public");
  const [language, setLanguage] = useState(defaultLanguage ?? "");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const pickedRef = useRef<Picked[]>([]);
  useEffect(() => { pickedRef.current = picked; }, [picked]);
  useEffect(() => () => pickedRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  function onFiles(list: FileList | null) {
    if (!list) return;
    const { accepted, errors: errs } = validateImageBatch(Array.from(list), picked.length);
    setErrors(errs);
    setPicked((cur) => [...cur, ...accepted.map((file) => ({ key: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }))]);
    if (fileRef.current) fileRef.current.value = "";
  }
  function remove(key: string) {
    setPicked((cur) => { cur.filter((p) => p.key === key).forEach((p) => URL.revokeObjectURL(p.preview)); return cur.filter((p) => p.key !== key); });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!body.trim() && picked.length === 0) { setErrors(["Write something or add an image."]); return; }
    setBusy(true); setErrors([]);
    const supabase = createClient();
    const uploaded: string[] = [];
    try {
      for (const p of picked) {
        const path = mediaPath(userId, crypto.randomUUID(), p.file.type);
        if (!path) throw new Error("Unsupported image type.");
        const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, p.file, { contentType: p.file.type, upsert: false });
        if (error) throw new Error("Could not upload an image. Please try again.");
        uploaded.push(path);
      }
      const res = await createPostAction(category, { body, visibility, language: language || null, paths: uploaded });
      if (!res.ok) throw new Error(res.error); // the server action already removed the files on failure
      router.push(`/learn/${category}/community`);
      router.refresh();
    } catch (err) {
      // Best-effort cleanup of anything uploaded before the failure (idempotent with the server's cleanup).
      if (uploaded.length) await supabase.storage.from(MEDIA_BUCKET).remove(uploaded);
      setErrors([err instanceof Error ? err.message : "Could not publish your post."]);
      setBusy(false);
    }
  }

  const field = "w-full rounded-md border border-border bg-card px-3 text-foreground";
  return (
    <form onSubmit={submit} className="space-y-5 rounded-lg border border-border bg-card p-4 sm:p-6" noValidate>
      <div>
        <label htmlFor={`${uid}-body`} className="mb-1.5 block text-sm font-semibold">Your post</label>
        <textarea id={`${uid}-body`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={MAX_BODY} rows={6}
          placeholder="Share a phrase you learned, a question, or how practice is going..." className={`${field} py-2.5`} />
        <p className="mt-1 text-right text-xs text-muted-foreground num" aria-live="polite">{body.length}/{MAX_BODY}</p>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-semibold">Images <span className="font-normal text-muted-foreground">({picked.length}/{MAX_POST_IMAGES}, JPEG, PNG, WebP or GIF, up to 5 MB each)</span></span>
        </div>
        {picked.length > 0 && (
          <ul className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {picked.map((p, i) => (
              <li key={p.key} className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt={`Selected image ${i + 1}: ${p.file.name}`} className="h-full w-full object-cover" />
                <button type="button" onClick={() => remove(p.key)} disabled={busy} aria-label={`Remove image ${i + 1}`}
                  className="absolute right-1 top-1 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-band text-on-band hover:bg-primary-hover disabled:opacity-50">
                  <X size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <input ref={fileRef} id={`${uid}-files`} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
        <Button type="button" variant="secondary" disabled={busy || picked.length >= MAX_POST_IMAGES} onClick={() => fileRef.current?.click()}>
          <ImagePlus size={18} aria-hidden="true" /> Add images
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-vis`} className="mb-1.5 block text-sm font-semibold">Who can see it</label>
          <select id={`${uid}-vis`} value={visibility} onChange={(e) => setVisibility(e.target.value as "public" | "friends")} className={`${field} h-11`}>
            <option value="public">Everyone in Language Learning</option>
            <option value="friends">Friends only</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-lang`} className="mb-1.5 block text-sm font-semibold">Language tag <span className="font-normal text-muted-foreground">(optional)</span></label>
          <select id={`${uid}-lang`} value={language} onChange={(e) => setLanguage(e.target.value)} className={`${field} h-11`}>
            <option value="">No tag</option>
            {ALL_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {errors.length > 0 && (
        <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {errors.map((m) => <p key={m}>{m}</p>)}
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>{busy ? <><Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Publishing...</> : "Publish post"}</Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => router.push(`/learn/${category}/community`)}>Cancel</Button>
      </div>
    </form>
  );
}
