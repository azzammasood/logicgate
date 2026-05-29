/**
 * Push Prisma schema to Supabase.
 * Usage (PowerShell):
 *   $env:SUPABASE_DB_PASSWORD="your-db-password"
 *   node --env-file=.env.local scripts/setup-db.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const password = process.env.SUPABASE_DB_PASSWORD;
// Supabase project ref for LogicGate (dashboard slug may differ from display name)
const ref = "fkbxuvrlxyadehjcoxhn";
const poolerPrefix = process.env.SUPABASE_POOLER_PREFIX ?? "aws-1";
const region = process.env.SUPABASE_REGION ?? "ap-south-1";

if (!password) {
  console.error("Set SUPABASE_DB_PASSWORD to your Supabase database password.");
  console.error("Find it: Dashboard → Project Settings → Database → Database password");
  process.exit(1);
}

const encoded = encodeURIComponent(password);
const pooled = `postgresql://postgres.${ref}:${encoded}@${poolerPrefix}-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
const direct = `postgresql://postgres.${ref}:${encoded}@${poolerPrefix}-${region}.pooler.supabase.com:5432/postgres`;

process.env.DATABASE_URL = pooled;
process.env.DIRECT_URL = direct;

console.log("Running prisma db push (direct / port 5432)...");
execSync("npm run db:push", { stdio: "inherit", env: process.env });

console.log("Running prisma generate...");
execSync("npx prisma generate", { stdio: "inherit", env: process.env });

console.log("Done. Verify tables in Supabase Table Editor.");
