import Link from "next/link";
import { Globe, Lock, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { SubmitButton } from "@/components/ui/button";
import { groupPath } from "@/lib/groups";
import type { LanguageRoom } from "@/lib/language/types";
import { joinLanguageRoomAction } from "@/app/(app)/learn/[category]/rooms/actions";

export function RoomCard({ room, category, isOwn }: { room: LanguageRoom; category: string; isOwn?: boolean }) {
  const voice = room.type === "voice";
  const live = room.live_count > 0;
  const full = voice && room.max_participants != null && room.live_count >= room.max_participants;
  return (
    <article className="flex h-full flex-col rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words font-display text-lg font-semibold leading-snug">{room.name}</h3>
        {voice && (
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${live ? "border-success text-success" : "border-border text-muted-foreground"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-success" : "bg-muted-foreground"}`} aria-hidden="true" />{live ? "Live" : "Quiet"}
          </span>
        )}
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {room.language && <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium text-foreground">{room.language}</span>}
        <span className="inline-flex items-center gap-1 capitalize">{room.visibility === "private" ? <Lock size={12} aria-hidden="true" /> : <Globe size={12} aria-hidden="true" />}{room.visibility}</span>
      </p>
      {room.description && <p className="mt-3 line-clamp-3 break-words text-sm text-muted-foreground">{room.description}</p>}
      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
        <div className="min-w-0 text-xs text-muted-foreground">
          <p className="num inline-flex items-center gap-1.5"><Users size={13} aria-hidden="true" />
            {voice ? <>{room.live_count}{room.max_participants ? ` / ${room.max_participants}` : ""} in call · {room.member_count} member{room.member_count === 1 ? "" : "s"}</> : <>{room.member_count} member{room.member_count === 1 ? "" : "s"}</>}
          </p>
          <p className="mt-0.5 truncate">By {isOwn ? "you" : room.creator_name ?? "a student"}</p>
        </div>
        {room.is_member ? (
          <Link href={groupPath(category, room.type, room.id)} className={buttonVariants({ variant: "secondary" })}>Open</Link>
        ) : (
          <form action={joinLanguageRoomAction}>
            <input type="hidden" name="id" value={room.id} /><input type="hidden" name="category" value={category} /><input type="hidden" name="kind" value={room.type} />
            <SubmitButton pendingText="Joining…" aria-label={`Join ${room.name}`}>{full ? "Join (full now)" : "Join"}</SubmitButton>
          </form>
        )}
      </div>
    </article>
  );
}
