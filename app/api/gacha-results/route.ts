import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

const resolveAdminId = async (request: Request) => {
  const auth = await requireAuth(request, { allowPublic: true });
  if (!auth.ok) return { ok: false as const };
  if (auth.type === "admin") {
    return { ok: true as const, adminId: auth.admin.id };
  }
  const result = await query("SELECT id FROM admins ORDER BY id ASC LIMIT 1");
  const adminId = result.rows[0]?.id;
  if (!adminId) return { ok: false as const };
  return { ok: true as const, adminId };
};

export async function GET(request: Request) {
  const resolved = await resolveAdminId(request);
  if (!resolved.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await query(
    "SELECT gacha_item_id FROM gacha_results WHERE admin_id = $1",
    [resolved.adminId],
  );
  const items = result.rows.map((row) => row.gacha_item_id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const resolved = await resolveAdminId(request);
  if (!resolved.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const gachaItemId = Number(body?.gachaItemId);
  if (!Number.isFinite(gachaItemId)) {
    return NextResponse.json({ error: "invalid gachaItemId" }, { status: 400 });
  }

  await query(
    `INSERT INTO gacha_results (admin_id, gacha_item_id)
     VALUES ($1, $2)
     ON CONFLICT (admin_id, gacha_item_id) DO NOTHING`,
    [resolved.adminId, Math.floor(gachaItemId)],
  );
  return NextResponse.json({ ok: true });
}
