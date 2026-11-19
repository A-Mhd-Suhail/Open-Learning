import { CopyButton } from "@/components/app/CopyButton";

/** The student's library card: the one place the Student ID is the hero. */
export function StudentCard({ name, studentId, role }: { name: string; studentId: string; role: string }) {
  return (
    <section aria-label="Your student card" className="w-full max-w-sm rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>Open Learning</span><span>{role}</span>
      </div>
      <p className="mt-6 truncate font-display text-lg font-semibold" title={name}>{name}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="num font-mono text-xl font-semibold tracking-wide"><span className="mark">{studentId}</span></p>
        <CopyButton value={studentId} label="Copy Student ID" />
      </div>
      <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">Share this ID so friends can find you.</p>
    </section>
  );
}
