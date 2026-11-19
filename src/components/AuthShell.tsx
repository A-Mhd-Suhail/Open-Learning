import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const POINTS = ["Pick School, JEE or NEET", "Watch lessons sorted by chapter", "Add friends by Student ID"];

/** Two-panel sign-up frame: a navy panel that explains the Student ID, and a calm form column. */
export function AuthShell({ step, children }: { step: 1 | 2; children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="band-surface flex flex-col bg-band px-6 py-8 text-on-band sm:px-10 lg:px-14 lg:py-12">
        <Logo inverse />
        <div className="my-10 hidden lg:block">
          <h2 className="max-w-sm text-5xl">Your Student ID is how friends find you.</h2>
          <div className="foil mt-6" aria-hidden="true" />
          <ul className="mt-8 space-y-3 text-band-muted">
            {POINTS.map((p) => <li key={p} className="flex items-center gap-3"><span aria-hidden="true" className="h-px w-5 bg-accent" />{p}</li>)}
          </ul>
        </div>
        <figure className="mt-auto hidden lg:block">
          <div className="max-w-sm rounded-xl border border-accent/40 p-6" aria-hidden="true">
            <div className="flex items-center justify-between text-xs font-semibold text-band-muted"><span>Open Learning</span><span>Student</span></div>
            <p className="num mt-8 font-mono text-2xl font-semibold tracking-wide text-accent">OL-2026-000042</p>
            <p className="mt-6 border-t border-white/15 pt-3 text-xs text-band-muted">Permanent. Created automatically when you sign in.</p>
          </div>
          <figcaption className="mt-3 text-xs text-band-muted">Example ID format.</figcaption>
        </figure>
      </aside>
      <main id="main" className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3" role="group" aria-label={`Step ${step} of 2`}>
            {[1, 2].map((n) => <span key={n} aria-hidden="true" className={cn("h-1 flex-1 rounded-full", n <= step ? "bg-accent" : "bg-border")} />)}
            <span className="num text-xs font-semibold text-muted-foreground">Step {step} of 2</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
