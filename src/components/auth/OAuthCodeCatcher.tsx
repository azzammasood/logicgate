"use client";

import { useEffect } from "react";

/**
 * Supabase redirects OAuth sign-ins to the project's Site URL (our marketing
 * root) with a `?code=…`. Forward that to the callback route, which exchanges
 * it for a session and lands the user in the app.
 */
export function OAuthCodeCatcher() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    if (window.location.pathname.startsWith("/auth/callback")) return;
    const next = params.get("next") ?? "/app/dashboard";
    window.location.replace(
      `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
    );
  }, []);

  return null;
}
