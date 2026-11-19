import { NextResponse } from "next/server";
import { adminOrResponse } from "@/lib/auth-api";
import { analyse, loadSource, sameOrigin } from "@/lib/videos/import";
import { ImportInputError } from "@/lib/videos/xlsx";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const a = await adminOrResponse();
  if ("res" in a) return a.res;
  try {
    const src = await loadSource(await req.formData());
    const r = await analyse(a.s.supabase, src);
    return NextResponse.json({
      source: src.kind, totalRows: r.totalRows, headerErrors: r.headerErrors, issues: r.issues.slice(0, 500),
      issueCount: r.issues.length, willCreate: r.valid.filter((v) => v.action === "create").length,
      willUpdate: r.valid.filter((v) => v.action === "update").length,
      rows: r.valid.slice(0, 200).map((v) => ({ row: v.row, video_id: v.video_id, title: v.title, exam: v.exam, subject: v.subject, chapter: v.chapter, action: v.action })),
    });
  } catch (e) {
    if (e instanceof ImportInputError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("preview failed", e);
    return NextResponse.json({ error: "Preview failed" }, { status: 500 });
  }
}
