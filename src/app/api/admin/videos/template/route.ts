import { NextResponse } from "next/server";
import { adminOrResponse } from "@/lib/auth-api";
import { buildTemplate } from "@/lib/videos/xlsx";

export async function GET() {
  const a = await adminOrResponse();
  if ("res" in a) return a.res;
  return new NextResponse(new Uint8Array(await buildTemplate()), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": 'attachment; filename="open-learning-videos-template.xlsx"',
      "cache-control": "no-store",
    },
  });
}
