import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

const STORAGE_DIR =
  process.env.STORAGE_DIR || path.join(process.cwd(), "data", "images");
const JOURNEY_DIR = path.join(STORAGE_DIR, "journey");
const PUBLIC_TOKEN =
  process.env.API_PUBLIC_TOKEN ||
  process.env.NEXT_PUBLIC_API_TOKEN ||
  "change-me";

const withToken = (url: string) => {
  if (!PUBLIC_TOKEN) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${PUBLIC_TOKEN}`;
};

type JourneyRow = {
  id: number;
  category: string;
  title: string;
  caption: string;
  filename: string | null;
  stored_path: string | null;
};

export async function GET(request: Request) {
  const auth = await requireAuth(request, { allowPublic: true });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await query(
    "SELECT id, category, title, caption, filename, stored_path FROM journey_items ORDER BY id ASC",
  );
  const items = (result.rows as JourneyRow[]).map((row) => ({
    id: row.id,
    category: row.category,
    title: row.title,
    caption: row.caption,
    url: row.filename ? withToken(`/api/journey/files/${row.id}`) : null,
  }));
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request, { allowPublic: false });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const caption = String(formData.get("caption") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const idValue = formData.get("id");

  if (!caption || !title || !category) {
    return NextResponse.json(
      { error: "title, caption, category are required" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  let filename: string | null = null;
  let storedPath: string | null = null;

  let id: number | null = null;
  if (typeof idValue === "string" && idValue.length > 0) {
    const parsed = Number(idValue);
    if (!Number.isFinite(parsed)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }
    id = parsed;
  }

  if (file instanceof File) {
    await fs.mkdir(JOURNEY_DIR, { recursive: true });
    const ext = path.extname(file.name || "");
    const safeExt = ext ? ext.toLowerCase().slice(0, 8) : "";
    filename = `journey-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${safeExt}`;
    storedPath = path.join(JOURNEY_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(storedPath, buffer);
  }

  if (id) {
    await query(
      `UPDATE journey_items
       SET title = $1,
           caption = $2,
           category = $3,
           filename = COALESCE($4, filename),
           stored_path = COALESCE($5, stored_path),
           updated_at = NOW()
       WHERE id = $6`,
      [title, caption, category, filename, storedPath, id],
    );
    return NextResponse.json({ ok: true, id });
  }

  const insert = await query(
    `INSERT INTO journey_items (title, caption, category, filename, stored_path)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [title, caption, category, filename, storedPath],
  );
  return NextResponse.json({ ok: true, id: insert.rows[0].id });
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
  await query("DELETE FROM journey_items WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
