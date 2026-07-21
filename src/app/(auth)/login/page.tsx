"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/stores/workspace";
import { AnimatedLogo } from "@/components/landing/AnimatedLogo";
import { useSessionUser } from "@/lib/supabase/useSessionUser";
import { ContinueAsUser } from "@/components/auth/ContinueAsUser";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const { user, loading: sessionLoading } = useSessionUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function syncAndRedirect() {
    try {
      const syncRes = await fetch("/api/auth/sync", { method: "POST" });
      if (!syncRes.ok) {
        const body = await syncRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not sync account");
      }
      const meRes = await fetch("/api/auth/me");
      const me = await meRes.json();
      if (me.error) throw new Error(me.error);
      const workspaces = me.data?.workspaces ?? [];
      if (workspaces.length > 0) {
        const stored = useWorkspaceStore.getState().currentWorkspaceId;
        const match = workspaces.find((w: { id: string }) => w.id === stored);
        setWorkspace(match?.id ?? workspaces[0].id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in sync failed");
      return;
    }
    router.push(searchParams.get("redirect") ?? "/app/dashboard");
    router.refresh();
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      await syncAndRedirect();
    } catch {
      toast.error(
        "Couldn't reach the authentication server. Check your connection or Supabase configuration."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/app/dashboard` },
      });
      if (error) toast.error(error.message);
      else toast.success("Check your email for the magic link");
    } catch {
      toast.error(
        "Couldn't reach the authentication server. Check your connection or Supabase configuration."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!EMAIL_RE.test(email.trim())) {
      toast.error("Enter your email above first, then click “Forgot password”.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) toast.error(error.message);
      else toast.success("Password reset link sent — check your email.");
    } catch {
      toast.error(
        "Couldn't reach the authentication server. Check your connection or Supabase configuration."
      );
    } finally {
      setLoading(false);
    }
  }

  if (sessionLoading) {
    return <div className="text-white/50">Loading…</div>;
  }

  if (user) {
    return <ContinueAsUser user={user} />;
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#161920] p-8">
      <AnimatedLogo size={72} className="mb-6" />
      <h1 className="font-[family-name:var(--font-auth-mono)] text-2xl font-bold text-[#4ade80]">
        LogicGate
      </h1>
      <p className="mt-2 text-sm text-white/50">Sign in to your workspace</p>
      <form onSubmit={handlePassword} className="mt-8 space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-[#0d0f14] border-white/10"
        />
        <div className="space-y-1.5">
          <PasswordInput
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-[#0d0f14] border-white/10"
          />
          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-xs text-white/40 transition-colors hover:text-[#4ade80] disabled:opacity-50"
            >
              Forgot password?
            </button>
          </div>
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--accent)] text-black hover:bg-[#4ade80]/90"
        >
          Sign in
        </Button>
      </form>
      <Button
        type="button"
        variant="ghost"
        className="mt-2 w-full text-[#4ade80]"
        onClick={handleMagicLink}
        disabled={loading || !email}
      >
        Send magic link
      </Button>
      <p className="mt-6 text-center text-sm text-white/40">
        No account?{" "}
        <Link href="/signup" className="text-[#4ade80] hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0f14] px-4">
      <Suspense fallback={<div className="text-white/50">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

