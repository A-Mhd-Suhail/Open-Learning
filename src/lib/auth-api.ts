import "server-only";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/** For route handlers: returns the admin session or a ready 401/403 response. Checked on the server, per request. */
export async function adminOrResponse() {
  const s = await getSession();
  if (!s) return { res: NextResponse.json({ error: "Not signed in" }, { status: 401 }) } as const;
  if (s.profile.role !== "admin") return { res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  return { s } as const;
}
