import { readFileSync } from "node:fs";
import pg from "pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set DIRECT_URL or DATABASE_URL in .env.local");
  process.exit(1);
}

const sql = readFileSync("src/lib/supabase/rls.sql", "utf8");
const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query(sql);
  console.log("RLS policies applied.");
} catch (e) {
  console.error("RLS apply failed:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
