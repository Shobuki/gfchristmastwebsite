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

  await query(
    "INSERT INTO gacha_state (admin_id) VALUES ($1) ON CONFLICT (admin_id) DO NOTHING",
    [resolved.adminId],
  );
  const result = await query(
    "SELECT coins FROM gacha_state WHERE admin_id = $1",
    [resolved.adminId],
  );
  const coins = result.rows[0]?.coins ?? 5;
  return NextResponse.json({ adminId: resolved.adminId, coins });
}

export async function POST(request: Request) {
  const resolved = await resolveAdminId(request);
  if (!resolved.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const coins = Number(body?.coins);
  if (!Number.isFinite(coins)) {
    return NextResponse.json({ error: "invalid coins" }, { status: 400 });
  }
  await query(
    `INSERT INTO gacha_state (admin_id, coins)
     VALUES ($1, $2)
     ON CONFLICT (admin_id)
     DO UPDATE SET coins = $2, updated_at = NOW()`,
    [resolved.adminId, Math.max(0, Math.floor(coins))],
  );
  return NextResponse.json({ ok: true });
}
