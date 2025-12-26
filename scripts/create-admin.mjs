import crypto from "node:crypto";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.error("Usage: node scripts/create-admin.mjs <username> <password>");
  process.exit(1);
}

const connectionString =
  process.env.POSTGRES_URL || process.env.DATABASE_URL || "";

if (!connectionString) {
  console.error("POSTGRES_URL or DATABASE_URL is required");
  process.exit(1);
}

const hashPassword = (value) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(value, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const { Pool } = pg;
const pool = new Pool({ connectionString });

const run = async () => {
  const passwordHash = hashPassword(password);
  await pool.query(
    "INSERT INTO admins (username, password_hash) VALUES ($1, $2)",
    [username, passwordHash],
  );
  console.log("Admin created:", username);
};

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pool.end());
