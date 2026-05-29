import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });
import { defineConfig } from "prisma/config";

/** Schema push / migrate must use session mode (5432), not transaction pooler (6543). */
const schemaUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!schemaUrl) {
  throw new Error("Set DIRECT_URL (port 5432) or DATABASE_URL in .env.local");
}
if (schemaUrl.includes(":6543") && !process.env.DIRECT_URL) {
  throw new Error(
    "DATABASE_URL uses port 6543 (PgBouncer). Set DIRECT_URL to port 5432 for prisma db push, or run: npm run db:push"
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: schemaUrl,
  },
});
