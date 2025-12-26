import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

const ALLOWED_RARITIES = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

export async function POST(request: Request) {
  const auth = await requireAuth(request, { allowPublic: false });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { id?: number; rarity?: string; gachaId?: number }
    | null;
  const id = Number(body?.id);
  const rarity = body?.rarity;
  const gachaIdInput = body?.gachaId;
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  if (Number.isFinite(Number(gachaIdInput))) {
    await query("UPDATE pictures SET gacha_id = $1 WHERE id = $2", [
      Number(gachaIdInput),
      id,
    ]);
    return NextResponse.json({ ok: true, gachaId: Number(gachaIdInput) });
  }
  if (!rarity || !ALLOWED_RARITIES.includes(rarity)) {
    return NextResponse.json({ error: "invalid rarity" }, { status: 400 });
  }

  const candidate = await query(
    `SELECT gacha_items.id
     FROM gacha_items
     LEFT JOIN pictures ON pictures.gacha_id = gacha_items.id
     WHERE gacha_items.rarity = $1
     GROUP BY gacha_items.id
     ORDER BY COUNT(pictures.id) ASC, gacha_items.id ASC
     LIMIT 1`,
    [rarity],
  );

  const gachaId = candidate.rows[0]?.id;
  if (!gachaId) {
    return NextResponse.json(
      { error: "no gacha items for rarity" },
      { status: 400 },
    );
  }

  await query("UPDATE pictures SET gacha_id = $1 WHERE id = $2", [
    gachaId,
    id,
  ]);
  return NextResponse.json({ ok: true, gachaId });
}
