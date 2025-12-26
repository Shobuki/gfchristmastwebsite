import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const { Pool } = pg;

const connectionString =
  process.env.POSTGRES_URL || process.env.DATABASE_URL || "";

if (!connectionString) {
  console.error("POSTGRES_URL or DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({ connectionString });

const migrationsDir = path.join(process.cwd(), "migrations");
const files = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const ensureMigrationsTable = async (client) => {
  await client.query(
    `CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,
  );
};

const getAppliedMigrations = async (client) => {
  const result = await client.query("SELECT filename FROM migrations");
  return new Set(result.rows.map((row) => row.filename));
};

const run = async () => {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);
    for (const file of files) {
      if (applied.has(file)) {
        continue;
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      await client.query(sql);
      await client.query("INSERT INTO migrations (filename) VALUES ($1)", [
        file,
      ]);
      console.log(`Applied ${file}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
