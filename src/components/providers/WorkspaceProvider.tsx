"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatedLogo } from "@/components/landing/AnimatedLogo";
import { useWorkspaceStore } from "@/stores/workspace";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);

  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as {
        user: { id: string; name: string; email: string };
        workspaces: { id: string; name: string; slug: string }[];
        needsProfile?: boolean;
      };
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isSuccess || !data) return;
    const workspaces = data.workspaces;
    if (workspaces.length === 0) return;
    const valid = workspaces.some((w) => w.id === workspaceId);
    if (!workspaceId || !valid) {
      setWorkspace(workspaces[0].id);
    }
  }, [isSuccess, data, workspaceId, setWorkspace]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background,#0d0f14)]">
        <AnimatedLogo size={72} />
        <p className="text-sm text-white/50">Loading workspace…</p>
      </div>
    );
  }

  // First run: a full-page setup instead of a modal over an empty dashboard.
  if (data && data.workspaces.length === 0) {
    return (
      <OnboardingFlow
        needsProfile={!!data.needsProfile}
        defaultName={data.user.name}
        onWorkspaceReady={(id) => {
          setWorkspace(id);
        }}
      />
    );
  }

  return <>{children}</>;
}
