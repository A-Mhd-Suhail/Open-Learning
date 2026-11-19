import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const POINTS = ["Pick School, JEE, NEET or Language Learning", "Watch lessons sorted by chapter", "Add friends by Student ID"];

/** Sign-in frame: a black panel that explains the Student ID, and a calm form column with a Back link and step indicator. */
export function AuthShell({ step, children }: { step: 1 | 2; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="band-surface flex flex-col border-b border-accent/30 bg-band pb-4 pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] text-on-band sm:px-10 lg:border-b-0 lg:px-14 lg:py-12">
        <Logo inverse className="h-11" />
        <div className="my-14 hidden lg:block">
          <h2 className="max-w-sm text-4xl leading-[1.1] xl:text-5xl">Your Student ID is how friends find you.</h2>
          <div className="foil mt-6" aria-hidden="true" />
          <ul className="mt-8 space-y-3 text-band-muted">
            {POINTS.map((p) => <li key={p} className="flex items-center gap-3"><span aria-hidden="true" className="h-px w-5 shrink-0 bg-accent" />{p}</li>)}
          </ul>
        </div>
        <figure className="mt-auto hidden lg:block">
          <div className="max-w-sm rounded-lg border border-accent/40 p-6" aria-hidden="true">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-band-muted"><span>Open Learning</span><span>Student</span></div>
            <p className="num mt-8 font-mono text-2xl font-semibold tracking-wide text-accent">OL-2026-000042</p>
            <p className="mt-6 border-t border-white/15 pt-3 text-xs text-band-muted">Permanent. Created automatically when you sign in.</p>
          </div>
          <figcaption className="mt-3 text-xs text-band-muted">Example ID format.</figcaption>
        </figure>
      </aside>
      <main id="main" className="flex flex-col px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-8 lg:px-12 lg:py-10">
        <Link href="/" className="-ml-2 inline-flex h-11 w-fit items-center gap-2 rounded-md px-2 text-sm font-semibold text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground">
          <ArrowLeft size={16} aria-hidden="true" />Back to home
        </Link>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3" role="group" aria-label={`Step ${step} of 2`}>
              {[1, 2].map((n) => <span key={n} aria-hidden="true" className={cn("h-1 flex-1 rounded-full", n <= step ? "bg-accent" : "bg-border")} />)}
              <span className="num text-xs font-semibold text-muted-foreground">Step {step} of 2</span>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
