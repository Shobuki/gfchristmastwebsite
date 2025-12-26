import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

type LoveRadarPayload = {
  targetLat: number;
  targetLng: number;
  userLat?: number | null;
  userLng?: number | null;
  distanceM?: number | null;
  distanceKm?: number | null;
  accuracyM?: number | null;
  status: string;
  errorMessage?: string | null;
};

const asNumber = (value: unknown) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

export async function POST(request: Request) {
  const auth = await requireAuth(request, { allowPublic: true });
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as LoveRadarPayload | null;
  if (!body) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const targetLat = asNumber(body.targetLat);
  const targetLng = asNumber(body.targetLng);
  if (targetLat == null || targetLng == null || !body.status) {
    return NextResponse.json(
      { error: "targetLat, targetLng, status are required" },
      { status: 400 },
    );
  }

  const userLat = asNumber(body.userLat);
  const userLng = asNumber(body.userLng);
  const distanceM = asNumber(body.distanceM);
  const distanceKm = asNumber(body.distanceKm);
  const accuracyM = asNumber(body.accuracyM);
  const errorMessage =
    typeof body.errorMessage === "string" ? body.errorMessage : null;

  await query(
    `INSERT INTO love_radar_logs
      (target_lat, target_lng, user_lat, user_lng, distance_m, distance_km, accuracy_m, status, error_message, target_point, user_point)
     VALUES (
       $1,
       $2,
       $3,
       $4,
       $5,
       $6,
       $7,
       $8,
       $9,
       point($2, $1),
       CASE WHEN $3 IS NULL OR $4 IS NULL THEN NULL ELSE point($4, $3) END
     )`,
    [
      targetLat,
      targetLng,
      userLat,
      userLng,
      distanceM,
      distanceKm,
      accuracyM,
      body.status,
      errorMessage,
    ],
  );

  return NextResponse.json({ ok: true });
}
