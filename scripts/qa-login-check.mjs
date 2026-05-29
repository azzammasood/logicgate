import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const email = process.env.QA_EMAIL;
const password = process.env.QA_PASSWORD;

if (!email || !password) {
  console.error("Set QA_EMAIL and QA_PASSWORD");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error) {
  console.error("Login failed:", error.message);
  process.exit(1);
}
console.log("Login OK, user id:", data.user?.id);
