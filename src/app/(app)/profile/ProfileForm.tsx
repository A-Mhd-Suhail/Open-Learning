"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { validateName } from "@/lib/validation";
import { updateDisplayName } from "./actions";

export function ProfileForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateName(name);
    if (err) return setMsg({ kind: "err", text: err });
    start(async () => {
      const r = await updateDisplayName(name);
      setMsg(r.error ? { kind: "err", text: r.error } : { kind: "ok", text: "Profile updated." });
    });
  }
  return (
    <form onSubmit={submit} noValidate className="mt-5">
      <label htmlFor="display-name" className="block text-sm font-semibold">Display name</label>
      <input id="display-name" value={name} maxLength={60} onChange={(e) => { setName(e.target.value); setMsg(null); }}
        className="mt-2 h-12 w-full rounded-md border border-border bg-background px-4" />
      <p role={msg?.kind === "err" ? "alert" : "status"} className={`mt-2 min-h-5 text-sm ${msg?.kind === "err" ? "text-destructive" : "text-success"}`}>{msg?.text}</p>
      <Button type="submit" className="mt-3" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
    </form>
  );
}
