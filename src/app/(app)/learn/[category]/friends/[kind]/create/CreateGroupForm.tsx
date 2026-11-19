"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createGroupAction, type ActionState } from "../../actions";

export function CreateGroupForm({ category, kind }: { category: string; kind: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createGroupAction, {});
  const input = "mt-1.5 w-full rounded-md border border-border bg-background px-3 text-sm";
  return (
    <form action={action} className="max-w-xl space-y-4 rounded-lg border border-border bg-card p-6">
      <input type="hidden" name="category" value={category} /><input type="hidden" name="kind" value={kind} />
      <div><label htmlFor="name" className="block text-sm font-semibold">Group name</label>
        <input id="name" name="name" required minLength={3} maxLength={60} className={`${input} h-11`} /></div>
      <div><label htmlFor="description" className="block text-sm font-semibold">Description (optional)</label>
        <textarea id="description" name="description" rows={3} maxLength={300} className={`${input} p-3`} /></div>
      <fieldset><legend className="text-sm font-semibold">Access</legend>
        <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm"><input type="radio" name="visibility" value="public" defaultChecked className="mt-1" /><span><strong>Public</strong> — anyone in this category can find and join.</span></label>
        <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm"><input type="radio" name="visibility" value="private" className="mt-1" /><span><strong>Private</strong> — only people with your invite link or friends you add can join.</span></label>
      </fieldset>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create group"}</Button>
    </form>
  );
}
