"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useSessionUser } from "@/lib/supabase/useSessionUser";
import { useWorkspaceStore } from "@/stores/workspace";
import { AnimatedLogo } from "@/components/landing/AnimatedLogo";

type Props = { params: Promise<{ token: string }> };

type Invite = {
  workspaceId: string;
  workspaceName: string;
  logoUrl: string | null;
  memberCount: number;
  alreadyMember: boolean;
};

type State =
  | { kind: "checking" }
  | { kind: "signedOut" }
  | { kind: "confirm"; invite: Invite }
  | { kind: "accepting" }
  | { kind: "success"; workspaceName: string; alreadyMember: boolean }
  | { kind: "error"; message: string };

export default function InvitePage({ params }: Props) {
  const { token } = use(params);
  const router = useRouter();
  const { user, loading } = useSessionUser();
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const [state, setState] = useState<State>({ kind: "checking" });
  const attempted = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setState({ kind: "signedOut" });
      return;
    }
    if (attempted.current) return;
    attempted.current = true;

    // Verify only — joining is an explicit click, not a side effect of
    // opening a link someone sent you.
    (async () => {
      try {
        const res = await fetch(`/api/invite/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (json.error) {
          setState({ kind: "error", message: json.error });
          return;
        }
        setState({ kind: "confirm", invite: json.data as Invite });
      } catch {
        setState({
          kind: "error",
          message: "Couldn't reach the server. Check your connection and try again.",
        });
      }
    })();
  }, [loading, user, token]);

  async function acceptInvite() {
    setState({ kind: "accepting" });
    try {
      const res = await fetch(`/api/invite/${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.error) {
        setState({ kind: "error", message: json.error });
        return;
      }
      setWorkspace(json.data.workspaceId);
      setState({
        kind: "success",
        workspaceName: json.data.workspaceName,
        alreadyMember: json.data.alreadyMember,
      });
      setTimeout(() => {
        router.push("/app/dashboard");
        router.refresh();
      }, 1200);
    } catch {
      setState({
        kind: "error",
        message: "Couldn't reach the server. Check your connection and try again.",
      });
    }
  }

  const loginHref = `/login?redirect=${encodeURIComponent(`/invite/${token}`)}`;
  const signupHref = `/signup?redirect=${encodeURIComponent(`/invite/${token}`)}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d0f14] px-4 text-center">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#161920] p-8">
        <AnimatedLogo size={64} className="mx-auto mb-6" />
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
          Workspace invite
        </h1>

        {(state.kind === "checking" || state.kind === "accepting") && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" />
            {state.kind === "checking" ? "Checking this invite…" : "Joining workspace…"}
          </p>
        )}

        {state.kind === "confirm" && (
          <>
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-[var(--accent,#4ade80)]/25 bg-[var(--accent,#4ade80)]/[0.07] p-3 text-left">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--accent,#4ade80)]/15 text-sm font-semibold text-[var(--accent,#4ade80)]">
                {state.invite.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={state.invite.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  state.invite.workspaceName.slice(0, 2).toUpperCase()
                )}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[11px] text-[var(--accent,#4ade80)]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {state.invite.alreadyMember ? "You're already a member" : "Valid invite"}
                </p>
                <p className="truncate text-sm font-semibold text-white">
                  {state.invite.workspaceName}
                </p>
                <p className="text-[11px] text-white/40">
                  {state.invite.memberCount} member
                  {state.invite.memberCount === 1 ? "" : "s"}
                  {!state.invite.alreadyMember && " · you'll join as a viewer"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={acceptInvite}
              className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-black hover:opacity-90"
            >
              {state.invite.alreadyMember
                ? `Switch to ${state.invite.workspaceName}`
                : `Join ${state.invite.workspaceName}`}
            </button>
            <Link
              href="/app/dashboard"
              className="mt-3 inline-block text-xs text-white/40 hover:text-white/70"
            >
              Not now
            </Link>
          </>
        )}

        {state.kind === "signedOut" && (
          <>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Sign in or create an account to join this workspace.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={loginHref}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-black hover:opacity-90"
              >
                Sign in to accept
              </Link>
              <Link
                href={signupHref}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-medium text-white/80 hover:bg-white/5"
              >
                Create an account
              </Link>
            </div>
          </>
        )}

        {state.kind === "success" && (
          <>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-[#4ade80]">
              <CheckCircle2 className="h-4 w-4" />
              {state.alreadyMember
                ? `You're already a member of ${state.workspaceName}.`
                : `Joined ${state.workspaceName}!`}
            </p>
            <p className="mt-2 text-xs text-white/40">Taking you to your dashboard…</p>
          </>
        )}

        {state.kind === "error" && (
          <>
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-red-400">
              <XCircle className="h-4 w-4" />
              {state.message}
            </p>
            <Link
              href="/app/dashboard"
              className="mt-6 inline-flex h-9 items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-medium text-white/80 hover:bg-white/5"
            >
              Go to dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
