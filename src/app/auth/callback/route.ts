import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth providers redirect back here with a `code` we exchange for a session.
// `next` is where to land afterwards (defaults to the dashboard).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Sign-in failed. Try again.")}`
  );
}
