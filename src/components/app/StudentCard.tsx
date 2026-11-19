import { CopyButton } from "@/components/app/CopyButton";

/** The student's library card: black with a gold Student ID. The one place the ID is the hero. */
export function StudentCard({ name, studentId, role }: { name: string; studentId: string; role: string }) {
  return (
    <section aria-label="Your student card" className="band-surface w-full max-w-sm rounded-xl border border-accent/40 bg-band p-6 text-on-band">
      <div className="flex items-center justify-between text-xs font-semibold text-band-muted">
        <span>Open Learning</span><span className="text-accent">{role}</span>
      </div>
      <p className="mt-8 truncate font-display text-xl" title={name}>{name}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="num font-mono text-xl font-semibold tracking-wide text-accent">{studentId}</p>
        <CopyButton value={studentId} label="Copy Student ID" />
      </div>
      <div className="foil-line mt-5" aria-hidden="true" />
      <p className="mt-3 text-xs text-band-muted">Share this ID so friends can find you.</p>
    </section>
  );
}
