"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AnimatedLogo } from "@/components/landing/AnimatedLogo";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Establish the recovery session from the email link, then reveal the form.
  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
      } catch {
        /* fall through — getSession will reflect the outcome */
      }
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setHasSession(!!data.session);
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Password must be at least 8 characters, with a letter and a number.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password updated. You're signed in.");
      router.push("/app/dashboard");
      router.refresh();
    } catch {
      toast.error("Couldn't reach the authentication server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0f14] px-4">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#161920] p-8">
        <AnimatedLogo size={72} className="mb-6" />
        <h1 className="font-[family-name:var(--font-auth-mono)] text-2xl font-bold text-[#4ade80]">
          Reset password
        </h1>

        {!ready ? (
          <p className="mt-4 text-sm text-white/50">Verifying your reset link…</p>
        ) : !hasSession ? (
          <>
            <p className="mt-4 text-sm text-white/50">
              This reset link is invalid or has expired. Request a new one from the
              login page.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm text-[#4ade80] hover:underline"
            >
              ← Back to login
            </Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-white/50">Choose a new password.</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
              <PasswordInput
                placeholder="New password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                className="bg-[#0d0f14] border-white/10"
              />
              <PasswordInput
                placeholder="Repeat new password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (error) setError(null);
                }}
                className="bg-[#0d0f14] border-white/10"
              />
              {error ? <p className="text-xs text-red-400">{error}</p> : null}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--accent)] text-black hover:bg-[#4ade80]/90"
              >
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
