"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { saveVideo, type FormState } from "./actions";
import type { Video } from "@/lib/videos/types";

const Field = ({ name, label, defaultValue, required, type = "text", wide }: { name: string; label: string; defaultValue?: string | number | null; required?: boolean; type?: string; wide?: boolean }) => (
  <div className={wide ? "sm:col-span-2" : ""}>
    <label htmlFor={name} className="block text-sm font-semibold">{label}{required && <span aria-hidden="true"> *</span>}</label>
    <input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} required={required} className="mt-1.5 h-11 w-full rounded-md border border-border bg-background px-3 text-sm" />
  </div>
);

export function VideoForm({ video }: { video?: Video }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveVideo, {});
  return (
    <form action={action} className="grid gap-4 rounded-lg border border-border bg-card p-6 sm:grid-cols-2">
      {video && <input type="hidden" name="id" value={video.id} />}
      <Field name="video_id" label="Video ID" defaultValue={video?.video_id} required />
      <div>
        <label htmlFor="exam" className="block text-sm font-semibold">Exam <span aria-hidden="true">*</span></label>
        <select id="exam" name="exam" defaultValue={video?.exam ?? "JEE"} className="mt-1.5 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"><option>JEE</option><option>NEET</option><option>School</option></select>
      </div>
      <Field name="class" label="Class" defaultValue={video?.class} />
      <Field name="subject" label="Subject" defaultValue={video?.subject} required />
      <Field name="chapter" label="Chapter" defaultValue={video?.chapter} required />
      <Field name="topic" label="Topic" defaultValue={video?.topic} />
      <Field name="year" label="Year" defaultValue={video?.year} type="number" />
      <Field name="language" label="Language" defaultValue={video?.language} />
      <Field name="title" label="Video title" defaultValue={video?.title} required wide />
      <Field name="youtube_url" label="YouTube link" defaultValue={video?.youtube_url} required wide />
      <Field name="thumbnail_url" label="Thumbnail URL (optional)" defaultValue={video?.thumbnail_url} wide />
      <div className="sm:col-span-2">
        <label htmlFor="description" className="block text-sm font-semibold">Description</label>
        <textarea id="description" name="description" rows={3} defaultValue={video?.description ?? ""} className="mt-1.5 w-full rounded-md border border-border bg-background p-3 text-sm" />
      </div>
      {state.error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2"><Button type="submit" disabled={pending}>{pending ? "Saving…" : video ? "Save changes" : "Add video"}</Button></div>
    </form>
  );
}
