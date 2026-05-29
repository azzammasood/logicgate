/**
 * End-to-end API smoke test (requires dev server: npm run dev)
 */
const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const email = `logicgate-${Date.now()}@test.local`;
const password = "TestPass123!";

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, cookies: res.headers.getSetCookie?.() ?? [] };
}

console.log("LogicGate integration test @", BASE);

// Health
const health = await req("/api/health");
console.log(health.status === 200 ? "✓ health" : "✗ health", health.json);

// Sign up via Supabase then sync (browser flow simulated via admin in test-supabase)
// For API test we need session cookie - skip full auth in script, test public health only

// Test definitions API without auth should 401
const defs = await req("/api/definitions?workspaceId=x");
console.log(defs.status === 401 ? "✓ definitions protected" : "✗ definitions auth", defs.status);

console.log("\nFor full flow: sign up at /signup in browser.");
