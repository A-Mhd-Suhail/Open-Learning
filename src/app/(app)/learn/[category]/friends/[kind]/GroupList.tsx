import Link from "next/link";
import { Lock, Globe } from "lucide-react";
import type { Group } from "@/lib/groups";
import { groupPath } from "@/lib/groups";
import { buttonVariants } from "@/components/ui/button";
import { joinGroupAction } from "../actions";

export function GroupList({ groups, category, joined, empty }: { groups: (Group & { members?: number })[]; category: string; joined?: Set<string>; empty: React.ReactNode }) {
  if (!groups.length) return <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">{empty}</div>;
  return (
    <ul className="divide-y divide-border border-y border-border">
      {groups.map((g) => {
        const isMember = joined?.has(g.id) ?? true;
        return (
          <li key={g.id} className="flex flex-wrap items-center justify-between gap-4 px-1 py-5 sm:px-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-semibold">{g.name}</h3>
              {g.description && <p className="mt-0.5 text-sm text-muted-foreground">{g.description}</p>}
              <p className="num mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 capitalize">{g.visibility === "private" ? <Lock size={12} aria-hidden="true" /> : <Globe size={12} aria-hidden="true" />}{g.visibility}</span>
                {g.members !== undefined && <span>{g.members} member{g.members === 1 ? "" : "s"}</span>}
              </p>
            </div>
            {isMember ? (
              <Link href={groupPath(category, g.type, g.id)} className={buttonVariants({ variant: "secondary" })}>Open</Link>
            ) : (
              <form action={joinGroupAction}>
                <input type="hidden" name="id" value={g.id} /><input type="hidden" name="category" value={category} /><input type="hidden" name="kind" value={g.type} />
                <button className={buttonVariants()}>Join</button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
