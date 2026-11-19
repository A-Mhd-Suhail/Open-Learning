import { NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { MEDIA_BUCKET } from "@/lib/language/types";

/** Stories are hidden by RLS the moment they expire; this job deletes the rows and the stored files. */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  // Hash both sides so the comparison is constant-time regardless of length.
  const a = createHash("sha256").update(header).digest();
  const b = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(a, b);
}

async function run(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("purge_expired_stories");
    if (error) { console.error("purge_expired_stories failed", error.message); return NextResponse.json({ error: "Purge failed" }, { status: 500 }); }
    const paths = ((data ?? []) as string[]).filter(Boolean);
    let removed = 0;
    let failed = 0;
    for (let i = 0; i < paths.length; i += 100) {
      const batch = paths.slice(i, i + 100);
      const { data: res, error: rmErr } = await admin.storage.from(MEDIA_BUCKET).remove(batch);
      if (rmErr) { failed += batch.length; console.error("story file removal failed", rmErr.message); } else removed += res?.length ?? 0;
    }
    return NextResponse.json({ expiredStories: paths.length, filesRemoved: removed, filesFailed: failed });
  } catch (e) {
    console.error("purge-stories failed", e instanceof Error ? e.message : "unknown");
    return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
