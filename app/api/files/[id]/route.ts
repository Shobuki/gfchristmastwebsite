import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

const STORAGE_DIR =
  process.env.STORAGE_DIR || path.join(process.cwd(), "data", "images");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request, { allowPublic: true });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await query(
    "SELECT filename, stored_path FROM pictures WHERE id = $1",
    [id],
  );
  if (result.rowCount === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const record = result.rows[0];
  const filePath =
    record.stored_path || path.join(STORAGE_DIR, record.filename);
  try {
    const file = await fs.readFile(filePath);
    const ext = path.extname(record.filename || "").toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
    return new NextResponse(file, {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return NextResponse.json({ error: "file missing" }, { status: 404 });
  }
}
