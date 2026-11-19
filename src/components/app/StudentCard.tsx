import { CopyButton } from "@/components/app/CopyButton";

/** The student's library card: black with a gold Student ID. The one place the ID is the hero. */
export function StudentCard({ name, studentId, role }: { name: string; studentId: string; role: string }) {
  return (
    <section aria-label="Your student card" className="band-surface w-full max-w-sm min-w-0 rounded-lg border border-accent/50 bg-band p-5 text-on-band sm:p-6">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold">
        <span className="tracking-wide text-band-muted">Open Learning</span>
        <span className="rounded-full border border-accent/60 px-2.5 py-0.5 text-accent">{role}</span>
      </div>
      <p className="mt-7 truncate font-display text-xl font-semibold" title={name}>{name}</p>
      <p className="mt-5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-band-muted">Student ID</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="num min-w-0 break-all font-mono text-lg font-semibold tracking-wide text-accent sm:text-xl">{studentId}</p>
        <CopyButton value={studentId} label="Copy Student ID" />
      </div>
      <div className="foil-line mt-4" aria-hidden="true" />
      <p className="mt-3 text-xs text-band-muted">Share this ID so friends can find you.</p>
    </section>
  );
}
