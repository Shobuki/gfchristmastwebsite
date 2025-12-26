import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuth(request, { allowPublic: true });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await query("SELECT * FROM letter_settings WHERE id = 1");
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
  const { title, body1, body2, buttonText, footer, voucher } = body || {};

  if (!title || !body1 || !body2 || !buttonText || !footer) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const voucherValue =
    typeof voucher === "string" && voucher.trim().length > 0
      ? voucher.trim()
      : null;

  await query(
    `UPDATE letter_settings
     SET title = $1,
         body1 = $2,
         body2 = $3,
         voucher = COALESCE($4, voucher),
         button_text = $5,
         footer = $6,
         updated_at = NOW()
     WHERE id = 1`,
    [title, body1, body2, voucherValue, buttonText, footer],
  );

  return NextResponse.json({ ok: true });
}
