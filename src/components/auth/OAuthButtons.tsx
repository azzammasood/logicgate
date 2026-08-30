"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Provider = "google" | "github";

// Inline brand marks so we don't pull an icon dependency for two glyphs.
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden>
      <path d="M12 1C5.9 1 1 5.9 1 12c0 4.85 3.15 8.96 7.51 10.42.55.1.75-.24.75-.53v-1.85c-3.06.67-3.7-1.48-3.7-1.48-.5-1.27-1.22-1.61-1.22-1.61-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.57 1.2 3.2.92.1-.71.38-1.2.7-1.47-2.45-.28-5.02-1.22-5.02-5.45 0-1.2.43-2.19 1.13-2.96-.11-.28-.49-1.4.11-2.92 0 0 .92-.3 3.02 1.13a10.4 10.4 0 0 1 5.5 0c2.1-1.43 3.02-1.13 3.02-1.13.6 1.52.22 2.64.11 2.92.7.77 1.13 1.76 1.13 2.96 0 4.24-2.58 5.17-5.03 5.44.39.34.74 1.01.74 2.04v3.03c0 .29.2.64.76.53A11 11 0 0 0 23 12c0-6.1-4.9-11-11-11Z" />
    </svg>
  );
}

export function OAuthButtons({ next = "/app/dashboard" }: { next?: string }) {
  const [busy, setBusy] = useState<Provider | null>(null);

  async function signInWith(provider: Provider) {
    setBusy(provider);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) {
        toast.error(error.message);
        setBusy(null);
      }
      // On success the browser navigates to the provider; no reset needed.
    } catch {
      toast.error("Couldn't start sign-in. Try again.");
      setBusy(null);
    }
  }

  const btn =
    "flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#0d0f14] text-sm text-white/85 transition-colors hover:bg-white/5 disabled:opacity-50";

  return (
    <div className="space-y-2">
      <button type="button" onClick={() => signInWith("google")} disabled={!!busy} className={btn}>
        <GoogleMark />
        {busy === "google" ? "Redirecting…" : "Continue with Google"}
      </button>
      <button type="button" onClick={() => signInWith("github")} disabled={!!busy} className={btn}>
        <GitHubMark />
        {busy === "github" ? "Redirecting…" : "Continue with GitHub"}
      </button>
    </div>
  );
}
