"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AnimatedLogo } from "@/components/landing/AnimatedLogo";
import type { SessionUser } from "@/lib/supabase/useSessionUser";

/**
 * Shown on the auth pages when a session already exists — lets the user jump
 * straight into the app or sign out to use a different account.
 */
export function ContinueAsUser({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const firstName = user.name.split(" ")[0];

  async function signOut() {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-white/10 bg-[var(--surface,#161920)] p-8 text-center">
      <AnimatedLogo size={72} className="mx-auto mb-6" />
      <h1 className="font-[family-name:var(--font-auth-mono)] text-2xl font-bold text-[var(--accent,#4ade80)]">
        Welcome back, {firstName}
      </h1>
      <p className="mt-2 text-sm text-white/50">
        You&apos;re already signed in
        {user.email ? (
          <>
            {" "}
            as <span className="text-white/70">{user.email}</span>
          </>
        ) : null}
        .
      </p>
      <Button
        onClick={() => router.push("/app/dashboard")}
        className="mt-8 w-full bg-[var(--accent,#4ade80)] text-black hover:opacity-90"
      >
        Continue as {firstName}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={signOut}
        disabled={busy}
        className="mt-2 w-full text-white/50 hover:text-white"
      >
        {busy ? "Signing out…" : "Sign out / use a different account"}
      </Button>
    </div>
  );
}
