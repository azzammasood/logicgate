"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAiStore } from "@/stores/ai";
import { toast } from "sonner";
import { USER_ROLES, formatUserRole } from "@/lib/roles";
import { AnimatedLogo } from "@/components/landing/AnimatedLogo";
import { useSessionUser } from "@/lib/supabase/useSessionUser";
import { ContinueAsUser } from "@/components/auth/ContinueAsUser";

const selectContentClass =
  "z-[200] border border-white/10 bg-[#161920] shadow-xl";
const selectTriggerClass = "w-full bg-[#0d0f14] border-white/10";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  organizationName?: string;
};

function validate(values: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationName: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = "Enter your full name (at least 2 characters).";
  }

  if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
    errors.password = "Use at least one letter and one number.";
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords don't match.";
  }

  // Organization is optional (personal use allowed). Only validate if provided.
  if (
    values.organizationName.trim().length > 0 &&
    values.organizationName.trim().length < 2
  ) {
    errors.organizationName = "Organization name must be at least 2 characters.";
  }

  return errors;
}

export default function SignupPage() {
  const router = useRouter();
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const setAiKey = useAiStore((s) => s.setApiKey);
  const { user, loading: sessionLoading } = useSessionUser();
  const [name, setName] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [role, setRole] = useState("STAKEHOLDER");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  function clearError(field: keyof FieldErrors) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validation = validate({
      name,
      email,
      password,
      confirmPassword,
      organizationName,
    });
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      return;
    }

    // Persist the optional AI key locally so it's ready after first sign-in.
    if (openrouterKey.trim()) {
      setAiKey(openrouterKey.trim());
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim(), role },
          emailRedirectTo: `${window.location.origin}/app/dashboard`,
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }

      // Supabase obfuscates "email already registered" to prevent account
      // enumeration: it returns a user with an empty `identities` array and no
      // error. Detect that and steer the user to sign in instead of showing a
      // bogus "verify your email" screen.
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        toast.error(
          "An account with this email already exists. Try signing in instead."
        );
        return;
      }

      // When email confirmation is enabled in Supabase, sign-up returns no
      // session — the account isn't usable until the user verifies their email.
      // Stash the org name so onboarding can create it after first sign-in.
      if (!data.session) {
        try {
          window.localStorage.setItem(
            "logicgate-pending-org",
            organizationName.trim()
          );
        } catch {
          /* ignore storage failures */
        }
        setVerificationEmail(email.trim());
        return;
      }

      await fetch("/api/auth/sync", { method: "POST" });
      const orgName =
        organizationName.trim() ||
        `${name.trim().split(/\s+/)[0] || "My"}'s workspace`;
      const ws = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      });
      const wsData = await ws.json();
      if (wsData.error) {
        toast.error(wsData.error);
        return;
      }
      if (wsData.data?.id) {
        setWorkspace(wsData.data.id);
      }
      toast.success("Welcome to LogicGate");
      router.push("/app/dashboard");
      router.refresh();
    } catch {
      toast.error(
        "Couldn't reach the authentication server. Check your connection or Supabase configuration."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!verificationEmail) return;
    setResending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: verificationEmail,
        options: { emailRedirectTo: `${window.location.origin}/app/dashboard` },
      });
      if (error) toast.error(error.message);
      else toast.success("Verification email sent again.");
    } catch {
      toast.error("Couldn't resend right now. Try again in a moment.");
    } finally {
      setResending(false);
    }
  }

  async function handleMagicLink() {
    if (!verificationEmail) return;
    setResending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: verificationEmail,
        options: { emailRedirectTo: `${window.location.origin}/app/dashboard` },
      });
      if (error) toast.error(error.message);
      else toast.success("Sign-in link sent — check your email.");
    } catch {
      toast.error("Couldn't send the link right now. Try again in a moment.");
    } finally {
      setResending(false);
    }
  }

  if (sessionLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background,#0d0f14)] px-4">
        <div className="text-white/50">Loading…</div>
      </main>
    );
  }

  if (user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background,#0d0f14)] px-4">
        <ContinueAsUser user={user} />
      </main>
    );
  }

  // Post-signup: waiting for email verification.
  if (verificationEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background,#0d0f14)] px-4">
        <div className="w-full max-w-md rounded-lg border border-white/10 bg-[var(--surface,#161920)] p-8 text-center">
          <AnimatedLogo size={72} className="mx-auto mb-6" />
          <h1 className="font-[family-name:var(--font-auth-mono)] text-2xl font-bold text-[var(--accent,#4ade80)]">
            Verify your email
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            We sent a confirmation link to{" "}
            <span className="text-white/90">{verificationEmail}</span>. Click the
            link in that email to activate your account, then sign in to finish
            setup.
          </p>
          <p className="mt-3 text-xs text-white/35">
            Didn&apos;t get it? Check your spam folder, or resend below.
          </p>
          <Button
            type="button"
            onClick={handleResend}
            disabled={resending}
            variant="outline"
            className="mt-6 w-full border-white/10"
          >
            {resending ? "Sending…" : "Resend verification email"}
          </Button>
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={resending}
            className="mt-3 w-full text-sm text-[var(--accent,#4ade80)] hover:underline disabled:opacity-50"
          >
            Or email me a magic sign-in link instead
          </button>
          <div className="mt-4">
            <Link
              href="/login"
              className="text-xs text-white/40 hover:text-white/70"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const fieldClass = (field: keyof FieldErrors) =>
    `bg-[var(--background,#0d0f14)] ${
      errors[field] ? "border-red-500/70" : "border-white/10"
    }`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background,#0d0f14)] px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[var(--surface,#161920)] p-8">
        <AnimatedLogo size={72} className="mb-6" />
        <h1 className="font-[family-name:var(--font-auth-mono)] text-2xl font-bold text-[var(--accent,#4ade80)]">
          Create account
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Start defining — solo or with your team.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <div>
            <Input
              placeholder="Full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError("name");
              }}
              aria-invalid={errors.name ? true : undefined}
              className={fieldClass("name")}
            />
            {errors.name ? (
              <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>
            ) : null}
          </div>
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              aria-invalid={errors.email ? true : undefined}
              className={fieldClass("email")}
            />
            {errors.email ? (
              <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
            ) : null}
          </div>
          <div>
            <PasswordInput
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              aria-invalid={errors.password ? true : undefined}
              className={fieldClass("password")}
            />
            {errors.password ? (
              <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
            ) : (
              <p className="mt-1.5 text-xs text-white/30">
                At least 8 characters, with a letter and a number.
              </p>
            )}
          </div>
          <div>
            <PasswordInput
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError("confirmPassword");
              }}
              aria-invalid={errors.confirmPassword ? true : undefined}
              className={fieldClass("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.confirmPassword}
              </p>
            ) : null}
          </div>
          <div>
            <Input
              placeholder="Organization name (optional)"
              value={organizationName}
              onChange={(e) => {
                setOrganizationName(e.target.value);
                clearError("organizationName");
              }}
              aria-invalid={errors.organizationName ? true : undefined}
              className={fieldClass("organizationName")}
            />
            {errors.organizationName ? (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.organizationName}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-white/30">
                Leave blank to use LogicGate for your personal logics.
              </p>
            )}
          </div>
          <div>
            <PasswordInput
              placeholder="OpenRouter API key (optional)"
              value={openrouterKey}
              onChange={(e) => setOpenrouterKey(e.target.value)}
              className="border-white/10 bg-[var(--background,#0d0f14)] font-mono text-xs"
            />
            <p className="mt-1.5 text-xs text-white/30">
              Enables AI features (free models available). You can add this later in Preferences → AI.
            </p>
          </div>
          <Select value={role} onValueChange={(v) => v && setRole(v)}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="Role">{formatUserRole(role)}</SelectValue>
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              {USER_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {formatUserRole(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent,#4ade80)] text-black hover:opacity-90"
          >
            {loading ? "Creating account…" : "Sign up"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-white/40">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent,#4ade80)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
