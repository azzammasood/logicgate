"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type SessionUser = { name: string; email: string };

function toUser(metaName: unknown, email: string | undefined): SessionUser {
  const name =
    (typeof metaName === "string" && metaName.trim()) ||
    email?.split("@")[0] ||
    "there";
  return { name, email: email ?? "" };
}

/**
 * Reads the current Supabase session on the client (from the auth cookie, no
 * network round-trip) and keeps it in sync via auth state changes. Resolves to
 * `null` when signed out, or when Supabase env vars are absent (marketing-only
 * deploys), so callers can safely fall back to a signed-out CTA.
 */
export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      setUser(null);
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        const u = data.session?.user;
        setUser(u ? toUser(u.user_metadata?.name, u.email) : null);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const u = session?.user;
      setUser(u ? toUser(u.user_metadata?.name, u.email) : null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
