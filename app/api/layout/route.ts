import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuth(request, { allowPublic: true });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await query("SELECT * FROM layout_settings WHERE id = 1");
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
  const { journeyColumns, gachaColumns } = body || {};

  const journey = Number(journeyColumns);
  const gacha = Number(gachaColumns);

  if (!Number.isFinite(journey) || !Number.isFinite(gacha)) {
    return NextResponse.json({ error: "invalid values" }, { status: 400 });
  }

  await query(
    `UPDATE layout_settings
     SET journey_columns = $1,
         gacha_columns = $2,
         updated_at = NOW()
     WHERE id = 1`,
    [journey, gacha],
  );

  return NextResponse.json({ ok: true });
}
