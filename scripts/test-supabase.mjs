import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const client = createClient(url, anon);
const admin = createClient(url, secret ?? anon);

const testEmail = `logicgate-test-${Date.now()}@test.local`;
const testPassword = "TestPass123!";

console.log("=== LogicGate Supabase connectivity ===\n");
console.log("URL:", url);

const { error: healthErr } = await client.auth.getSession();
console.log("Auth API:", healthErr ? `FAIL ${healthErr.message}` : "OK");

const { data: signUp, error: signUpErr } = await admin.auth.admin.createUser({
  email: testEmail,
  password: testPassword,
  email_confirm: true,
  user_metadata: { name: "Test User", role: "ENGINEER" },
});

if (signUpErr) {
  console.log("Admin createUser:", signUpErr.message);
} else {
  console.log("Admin createUser: OK", signUp.user?.id);
  const { error: delErr } = await admin.auth.admin.deleteUser(signUp.user.id);
  console.log("Cleanup user:", delErr ? delErr.message : "OK");
}

const { error: tableErr } = await admin.from("User").select("id").limit(1);
console.log(
  "Prisma User table:",
  tableErr ? `MISSING (${tableErr.message}) — run: npm run db:push` : "OK"
);

console.log("\nDone.");
