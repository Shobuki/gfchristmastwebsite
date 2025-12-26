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

type RarityRow = {
  rarity: string;
  weight: number;
};

export async function GET(request: Request) {
  const auth = await requireAuth(request, { allowPublic: true });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await query(
    "SELECT rarity, weight FROM gacha_rarity_settings ORDER BY rarity ASC",
  );
  const items = (result.rows as RarityRow[]).filter((row) =>
    ALLOWED_RARITIES.includes(row.rarity),
  );
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, { allowPublic: false });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { rarity?: string; weight?: number }
    | null;
  const rarity = body?.rarity;
  const weight = Number(body?.weight);
  if (!rarity || !ALLOWED_RARITIES.includes(rarity)) {
    return NextResponse.json({ error: "invalid rarity" }, { status: 400 });
  }
  if (!Number.isFinite(weight) || weight < 0) {
    return NextResponse.json({ error: "invalid weight" }, { status: 400 });
  }

  await query(
    `INSERT INTO gacha_rarity_settings (rarity, weight)
     VALUES ($1, $2)
     ON CONFLICT (rarity)
     DO UPDATE SET weight = $2, updated_at = NOW()`,
    [rarity, Math.floor(weight)],
  );
  return NextResponse.json({ ok: true });
}
