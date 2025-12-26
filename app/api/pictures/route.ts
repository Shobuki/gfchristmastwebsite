import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

const STORAGE_DIR =
  process.env.STORAGE_DIR || path.join(process.cwd(), "data", "images");
const PUBLIC_TOKEN =
  process.env.API_PUBLIC_TOKEN ||
  process.env.NEXT_PUBLIC_API_TOKEN ||
  "change-me";

const withToken = (url: string) => {
  if (!PUBLIC_TOKEN) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${PUBLIC_TOKEN}`;
};

export async function GET(request: Request) {
  const auth = await requireAuth(request, { allowPublic: true });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const gachaId = url.searchParams.get("gachaId");

  let result;
  if (gachaId) {
    result = await query(
      "SELECT id, original_name, created_at, gacha_id FROM pictures WHERE gacha_id = $1 ORDER BY created_at DESC LIMIT 100",
      [Number(gachaId)],
    );
  } else {
    result = await query(
      "SELECT id, original_name, created_at, gacha_id FROM pictures ORDER BY created_at DESC LIMIT 200",
    );
  }

  type PictureRow = {
    id: number;
    original_name: string | null;
    created_at: string;
    gacha_id: number | null;
  };

  const items = (result.rows as PictureRow[]).map((row) => ({
    id: row.id,
    originalName: row.original_name,
    createdAt: row.created_at,
    gachaId: row.gacha_id ?? null,
    url: withToken(`/api/files/${row.id}`),
  }));
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, { allowPublic: true });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") || formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  await fs.mkdir(STORAGE_DIR, { recursive: true });
  const ext = path.extname(file.name || "");
  const safeExt = ext ? ext.toLowerCase().slice(0, 8) : "";
  const filename = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}${safeExt}`;
  const storedPath = path.join(STORAGE_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(storedPath, buffer);

  const gachaIdValue = formData.get("gachaId");
  const gachaId =
    typeof gachaIdValue === "string" && gachaIdValue.trim().length > 0
      ? Number(gachaIdValue)
      : null;

  const result = await query(
    "INSERT INTO pictures (filename, original_name, mime_type, size, stored_path, gacha_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    [
      filename,
      file.name || null,
      file.type || null,
      file.size,
      storedPath,
      Number.isFinite(gachaId) ? gachaId : null,
    ],
  );

  return NextResponse.json({
    id: result.rows[0].id,
    url: withToken(`/api/files/${result.rows[0].id}`),
  });
}
