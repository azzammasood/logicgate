/**
 * Run prisma db push against a direct Postgres connection (port 5432).
 * Transaction pooler (6543) causes: prepared statement "s1" already exists
 */
import { config } from "dotenv";
import { execSync } from "node:child_process";

config({ path: ".env" });
config({ path: ".env.local", override: true });

function directUrlFromPooled(pooled) {
  if (!pooled.includes(":6543")) return null;
  return pooled
    .replace(":6543", ":5432")
    .replace(/[?&]pgbouncer=true/gi, "")
    .replace(/\?&/, "?")
    .replace(/\?$/, "");
}

let url = process.env.DIRECT_URL;
if (!url && process.env.DATABASE_URL) {
  url = directUrlFromPooled(process.env.DATABASE_URL);
  if (url) {
    console.log("Using direct session URL (5432) derived from DATABASE_URL.");
  }
}

if (!url) {
  console.error(
    "Set DIRECT_URL in .env.local to your Supabase Session pooler URL (port 5432).\n" +
      "Example: postgresql://postgres.<ref>:<password>@aws-1-ap-south-1.pooler.supabase.com:5432/postgres\n" +
      "Keep DATABASE_URL on port 6543 for the running app."
  );
  process.exit(1);
}

if (url.includes(":6543")) {
  console.error("DIRECT_URL must use port 5432 (session mode), not 6543 (transaction pooler).");
  process.exit(1);
}

execSync("npx prisma db push", {
  stdio: "inherit",
  env: { ...process.env, DIRECT_URL: url },
});
