import { NextResponse } from "next/server";

import { query } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

type AdminRow = {
  id: number;
  username: string;
  password_hash: string;
};

export async function POST(request: Request) {
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

  const result = await query(
    "SELECT id, username, password_hash FROM admins WHERE username = $1",
    [username],
  );
  const admin = result.rows[0] as AdminRow | undefined;
  if (!admin || !verifyPassword(password, admin.password_hash)) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  const session = await createSession(admin.id);
  return NextResponse.json({
    token: session.token,
    expiresAt: session.expiresAt,
    username: admin.username,
  });
}
