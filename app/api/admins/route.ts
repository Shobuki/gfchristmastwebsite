import { NextResponse } from "next/server";

import { hashPassword, requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

type AdminRow = {
  id: number;
  username: string;
  created_at: string;
};

export async function GET(request: Request) {
  const auth = await requireAuth(request, { allowPublic: false });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await query(
    "SELECT id, username, created_at FROM admins ORDER BY id ASC",
  );
  const items = (result.rows as AdminRow[]).map((row) => ({
    id: row.id,
    username: row.username,
    createdAt: row.created_at,
  }));
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, { allowPublic: false });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;
  const username = body?.username?.trim();
  const password = body?.password || "";
  if (!username || !password) {
    return NextResponse.json(
      { error: "username and password are required" },
      { status: 400 },
    );
  }

  const passwordHash = hashPassword(password);
  const result = await query(
    "INSERT INTO admins (username, password_hash) VALUES ($1, $2) RETURNING id",
    [username, passwordHash],
  );
  return NextResponse.json({ ok: true, id: result.rows[0].id });
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
  await query("DELETE FROM admins WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
