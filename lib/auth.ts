import crypto from "node:crypto";

import { query } from "@/lib/db";

const SESSION_DAYS = 30;

export const getBearerToken = (request: Request) => {
  const header = request.headers.get("authorization") || "";
  const [, token] = header.split(" ");
  if (token) return token;
  try {
    const url = new URL(request.url);
    const queryToken = url.searchParams.get("token");
    return queryToken || null;
  } catch {
    return null;
  }
};

const isPublicToken = (token: string | null) => {
  if (!token) return false;
  const publicToken =
    process.env.API_PUBLIC_TOKEN ||
    process.env.NEXT_PUBLIC_API_TOKEN ||
    "change-me";
  return Boolean(publicToken) && token === publicToken;
};

const hashWithSalt = (password: string, salt: string) => {
  return crypto.scryptSync(password, salt, 64).toString("hex");
};

export const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashWithSalt(password, salt);
  return `${salt}:${hash}`;
};

export const verifyPassword = (password: string, stored: string) => {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = hashWithSalt(password, salt);
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
};

export const createToken = () => crypto.randomBytes(32).toString("hex");

export const createSession = async (adminId: number) => {
  const token = createToken();
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  await query(
    "INSERT INTO admin_sessions (admin_id, token, expires_at) VALUES ($1, $2, $3)",
    [adminId, token, expiresAt],
  );
  return { token, expiresAt };
};

export const getAdminByToken = async (token: string) => {
  const result = await query(
    `SELECT admins.id, admins.username
     FROM admin_sessions
     JOIN admins ON admins.id = admin_sessions.admin_id
     WHERE admin_sessions.token = $1
       AND admin_sessions.expires_at > NOW()`,
    [token],
  );
  return result.rows[0] || null;
};

export const requireAuth = async (
  request: Request,
  options: { allowPublic: boolean },
) => {
  const token = getBearerToken(request);
  if (options.allowPublic && isPublicToken(token)) {
    return { ok: true, type: "public" as const };
  }
  if (token) {
    const admin = await getAdminByToken(token);
    if (admin) {
      return { ok: true, type: "admin" as const, admin };
    }
  }
  return { ok: false as const };
};
