"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const KEY = "ol_nav_stack";
const EVENT = "ol-nav-change";
const MAX = 30;

function read(): string[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch { return []; }
}

/** Raw snapshot string for useSyncExternalStore (stable between changes). */
export function getNavSnapshot(): string {
  try { return sessionStorage.getItem(KEY) ?? "[]"; } catch { return "[]"; }
}
export const getNavServerSnapshot = () => "[]";
export function subscribeNav(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/**
 * The in-app page that came before `current`, or null when the visit started outside the app (or after a fresh tab).
 * Order-independent: works whether or not the tracker has already recorded `current`.
 */
export function previousPath(snapshot: string, current: string): string | null {
  let stack: string[] = [];
  try { const v = JSON.parse(snapshot); if (Array.isArray(v)) stack = v; } catch {}
  const top = stack[stack.length - 1];
  const prev = top === current ? stack[stack.length - 2] : top;
  return prev && prev !== current ? prev : null;
}

/**
 * Records the in-app pathname trail in sessionStorage. Moving to the page just below the top is treated as a
 * "back" and pops the trail, so BackButton knows whether history.back() really lands on a page of this app.
 * Renders nothing.
 */
export function NavTracker() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const stack = read();
      const n = stack.length;
      if (stack[n - 1] === pathname) return;
      if (n >= 2 && stack[n - 2] === pathname) stack.pop();
      else stack.push(pathname);
      sessionStorage.setItem(KEY, JSON.stringify(stack.slice(-MAX)));
      window.dispatchEvent(new Event(EVENT));
    } catch { /* storage blocked: BackButton falls back to the parent link */ }
  }, [pathname]);
  return null;
}
