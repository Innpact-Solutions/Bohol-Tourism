import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Azure Database for PostgreSQL requires SSL with a verified certificate.
  // pg v8 treats sslmode=require as verify-full; we set it explicitly here
  // so the behaviour is clear and forward-compatible.
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export default pool;
