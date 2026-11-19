import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminOrResponse } from "@/lib/auth-api";
import { analyse, loadSource, sameOrigin } from "@/lib/videos/import";
import { toDbRow } from "@/lib/videos/validate";
import { ImportInputError } from "@/lib/videos/xlsx";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const a = await adminOrResponse();
  if ("res" in a) return a.res;
  try {
    // Re-parse and re-validate on the server: the client's preview is never trusted.
    const src = await loadSource(await req.formData());
    const r = await analyse(a.s.supabase, src);
    if (r.headerErrors.length) return NextResponse.json({ error: r.headerErrors.join("; ") }, { status: 400 });
    const payload = r.valid.map(toDbRow);
    for (let i = 0; i < payload.length; i += 200) {
      // Runs as the admin user: RLS (is_admin) enforces the write permission in the database too.
      const { error } = await a.s.supabase.from("videos").upsert(payload.slice(i, i + 200), { onConflict: "video_id" });
      if (error) { console.error("import failed", error.message); return NextResponse.json({ error: "Database rejected the import. Nothing after this batch was written." }, { status: 500 }); }
    }
    const created = r.valid.filter((v) => v.action === "create").length;
    const updated = r.valid.length - created;
    const { data: report, error: reportError } = await a.s.supabase.from("import_reports").insert({
      admin_id: a.s.user.id, source: src.kind, source_ref: src.ref, total_rows: r.totalRows,
      created_count: created, updated_count: updated, skipped_count: r.issues.length, errors: r.issues.slice(0, 200),
    }).select("id").single();
    if (reportError) console.error("import report not saved", reportError.message);
    revalidatePath("/learn", "layout");
    return NextResponse.json({ reportId: report?.id ?? null, totalRows: r.totalRows, created, updated, skipped: r.issues.length, issues: r.issues.slice(0, 500) });
  } catch (e) {
    if (e instanceof ImportInputError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("import failed", e);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
