import { Pool } from "pg";

let pool: Pool | null = null;

const getPool = () => {
  if (pool) return pool;
  const connectionString =
    process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
  if (!connectionString) {
    throw new Error("POSTGRES_URL or DATABASE_URL is required");
  }
  pool = new Pool({ connectionString });
  return pool;
};

export async function query(text: string, params?: unknown[]) {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
