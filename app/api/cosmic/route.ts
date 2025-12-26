import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuth(request, { allowPublic: true });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await query("SELECT * FROM cosmic_settings WHERE id = 1");
  if (result.rowCount === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ item: result.rows[0] });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, { allowPublic: false });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    introTitle,
    introSubtitle,
    timelineTitle,
    date1,
    caption1,
    date2,
    caption2,
  } = body || {};

  if (
    !introTitle ||
    !introSubtitle ||
    !timelineTitle ||
    !date1 ||
    !caption1 ||
    !date2 ||
    !caption2
  ) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  await query(
    `UPDATE cosmic_settings
     SET intro_title = $1,
         intro_subtitle = $2,
         timeline_title = $3,
         date1 = $4,
         caption1 = $5,
         date2 = $6,
         caption2 = $7,
         updated_at = NOW()
     WHERE id = 1`,
    [
      introTitle,
      introSubtitle,
      timelineTitle,
      date1,
      caption1,
      date2,
      caption2,
    ],
  );

  return NextResponse.json({ ok: true });
}
