"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inviteFriendAction, type ActionState } from "../../actions";

export function InviteToGroup({ friendId, groups }: { friendId: string; groups: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(inviteFriendAction, {});
  if (!groups.length) return <p className="mt-5 text-sm text-muted-foreground">Study together: create a group of your own first, then you can add this friend to it.</p>;
  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="friend" value={friendId} />
      <label htmlFor="group" className="block text-sm font-semibold">Study together — add to one of your groups</label>
      <div className="mt-2 flex gap-2">
        <select id="group" name="group" className="h-11 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-base sm:text-sm">{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
        <Button type="submit" loading={pending} loadingText="Adding…">Add</Button>
      </div>
      <p role="status" className={`mt-2 text-sm ${state.error ? "text-destructive" : "text-success"}`}>{state.error ?? state.ok}</p>
    </form>
  );
}
