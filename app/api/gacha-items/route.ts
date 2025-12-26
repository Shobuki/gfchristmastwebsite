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

export async function GET(request: Request) {
  const auth = await requireAuth(request, { allowPublic: true });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await query(
    "SELECT id, rarity, title, caption FROM gacha_items ORDER BY id ASC",
  );
  type GachaRow = {
    id: string | number;
    rarity: string;
    title: string;
    caption: string;
  };
  const items = (result.rows as GachaRow[]).map((row) => ({
    id: Number(row.id),
    rarity: row.rarity,
    title: row.title,
    caption: row.caption,
  }));
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, { allowPublic: false });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, rarity, title, caption } = body || {};

  if (!rarity || !title || !caption) {
    return NextResponse.json(
      { error: "rarity, title, caption are required" },
      { status: 400 },
    );
  }
  if (!ALLOWED_RARITIES.includes(rarity)) {
    return NextResponse.json({ error: "invalid rarity" }, { status: 400 });
  }

  if (id) {
    await query(
      `UPDATE gacha_items
       SET rarity = $1,
           title = $2,
           caption = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [rarity, title, caption, id],
    );
    return NextResponse.json({ ok: true, id: Number(id) });
  }

  const result = await query(
    `INSERT INTO gacha_items (rarity, title, caption)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [rarity, title, caption],
  );
  return NextResponse.json({ ok: true, id: Number(result.rows[0].id) });
}

export async function DELETE(request: Request) {
  const auth = await requireAuth(request, { allowPublic: false });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const idValue = url.searchParams.get("id");
  if (!idValue) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const id = Number(idValue);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await query("DELETE FROM gacha_items WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
