"use client";
import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ALL_LANGUAGES } from "@/lib/language/languages";
import { createLanguageRoomAction, type RoomActionState } from "@/app/(app)/learn/[category]/rooms/actions";

const field = "mt-1.5 w-full rounded-md border border-border bg-background px-3 text-base sm:text-sm";

export function CreateRoomForm({ category, kind, defaultLanguage = "" }: { category: string; kind: "chat" | "voice"; defaultLanguage?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus size={16} aria-hidden="true" />Create room</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={kind === "voice" ? "Create a voice room" : "Create a chat room"}>
        <RoomForm category={category} kind={kind} defaultLanguage={defaultLanguage} onCancel={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function RoomForm({ category, kind, defaultLanguage, onCancel }: { category: string; kind: "chat" | "voice"; defaultLanguage: string; onCancel: () => void }) {
  const [state, action, pending] = useActionState<RoomActionState, FormData>(createLanguageRoomAction, {});
  const id = `room-${kind}`;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="category" value={category} /><input type="hidden" name="kind" value={kind} />
      <div><label htmlFor={`${id}-name`} className="block text-sm font-semibold">Room name</label>
        <input id={`${id}-name`} name="name" required minLength={3} maxLength={60} autoComplete="off" className={`${field} h-11`} /></div>
      <div><label htmlFor={`${id}-lang`} className="block text-sm font-semibold">Language</label>
        <input id={`${id}-lang`} name="language" required minLength={2} maxLength={40} list={`${id}-langs`} defaultValue={defaultLanguage} placeholder="e.g. Tamil" className={`${field} h-11`} />
        <datalist id={`${id}-langs`}>{ALL_LANGUAGES.map((l) => <option key={l} value={l} />)}</datalist></div>
      <div><label htmlFor={`${id}-desc`} className="block text-sm font-semibold">Description (optional)</label>
        <textarea id={`${id}-desc`} name="description" rows={3} maxLength={300} className={`${field} py-2.5`} /></div>
      {kind === "voice" && (
        <div><label htmlFor={`${id}-max`} className="block text-sm font-semibold">Participant limit (optional)</label>
          <input id={`${id}-max`} name="max" type="number" inputMode="numeric" min={2} max={50} aria-describedby={`${id}-max-help`} className={`${field} h-11`} />
          <p id={`${id}-max-help`} className="mt-1 text-xs text-muted-foreground">Between 2 and 50. Leave empty for no limit.</p></div>
      )}
      <fieldset><legend className="text-sm font-semibold">Access</legend>
        <label className="mt-2 flex min-h-11 cursor-pointer items-start gap-2 text-sm"><input type="radio" name="visibility" value="public" defaultChecked className="mt-1" /><span><strong>Public</strong> — anyone learning languages can find and join.</span></label>
        <label className="flex min-h-11 cursor-pointer items-start gap-2 text-sm"><input type="radio" name="visibility" value="private" className="mt-1" /><span><strong>Private</strong> — only people you invite can join.</span></label>
      </fieldset>
      <p role="alert" aria-live="assertive" className="text-sm text-destructive empty:hidden">{state.error}</p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create room"}</Button>
      </div>
    </form>
  );
}
