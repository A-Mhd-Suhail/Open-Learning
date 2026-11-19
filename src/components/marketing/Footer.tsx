import Link from "next/link";
import { Logo } from "@/components/Logo";
import { NAV_GROUPS } from "./nav-data";

export function Footer() {
  return (
    <footer className="band-surface border-t border-white/10 bg-band text-on-band">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_2fr]">
        <div>
          <Logo inverse />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-band-muted">Connecting students. Empowering every learner.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
          {NAV_GROUPS.map((g) => (
            <div key={g.id}>
              <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-gold">{g.label}</h2>
              <ul className="mt-4 space-y-1">
                {g.items.map((it) => (
                  <li key={it.href}><Link href={it.href} className="block py-1.5 text-sm text-band-muted transition-colors hover:text-on-band">{it.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-xs text-band-muted sm:flex-row sm:justify-between sm:px-6">
          <p>Open Learning. Free to join with Google.</p>
          <p>Study-group, friends and room pages open after you sign in.</p>
        </div>
      </div>
    </footer>
  );
}
