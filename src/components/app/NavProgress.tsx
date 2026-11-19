"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin top progress bar for in-app navigation. Starts on the click of an internal link (so feedback is
 * immediate, before the server responds) and ends when the pathname changes. It is purely visual: no delay is added.
 */
export function NavProgress() {
  const pathname = usePathname();
  // `from` is the pathname the click happened on; the bar is visible only while we are still on it (derived, no effect needed).
  const [from, setFrom] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      setFrom(location.pathname);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setFrom(null), 15000); // safety: never stick forever
    };
    document.addEventListener("click", onClick, true);
    return () => { document.removeEventListener("click", onClick, true); if (timer.current) clearTimeout(timer.current); };
  }, []);

  if (from === null || from !== pathname) return null;
  return (
    <div role="progressbar" aria-label="Loading page" aria-hidden="false" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent">
      <div key={from} className="ol-progress h-full w-full bg-accent" />
    </div>
  );
}
