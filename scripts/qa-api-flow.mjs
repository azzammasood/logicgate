import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const email = process.env.QA_EMAIL;
const password = process.env.QA_PASSWORD;
const base = process.env.QA_BASE_URL ?? "http://localhost:3000";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error) {
  console.error("auth:", error.message);
  process.exit(1);
}

const session = data.session;
const cookie = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]}-auth-token=${encodeURIComponent(JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token, expires_at: session.expires_at, expires_in: session.expires_in, token_type: session.token_type, user: data.user }))}`;

// Simpler: use access token header - API uses cookies from SSR
// Hit sync via fetch with Authorization
for (const path of ["/api/auth/sync", "/api/auth/me", "/api/definitions?workspaceId=test"]) {
  const res = await fetch(`${base}${path}`, {
    method: path.includes("sync") ? "POST" : "GET",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const text = await res.text();
  console.log(path, res.status, text.slice(0, 200));
}
