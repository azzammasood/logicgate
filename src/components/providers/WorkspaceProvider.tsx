"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/stores/workspace";
import { CreateWorkspaceDialog } from "@/components/onboarding/CreateWorkspaceDialog";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as {
        user: { id: string; name: string; email: string };
        workspaces: { id: string; name: string; slug: string }[];
      };
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isSuccess || !data) return;
    const workspaces = data.workspaces;
    if (workspaces.length === 0) {
      setShowOnboarding(true);
      return;
    }
    const valid = workspaces.some((w) => w.id === workspaceId);
    if (!workspaceId || !valid) {
      setWorkspace(workspaces[0].id);
    }
    setShowOnboarding(false);
  }, [isSuccess, data, workspaceId, setWorkspace]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background,#0d0f14)] text-white/50">
        Loading workspace…
      </div>
    );
  }

  return (
    <>
      {children}
      <CreateWorkspaceDialog
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        required
        onCreated={(id) => {
          setWorkspace(id);
          setShowOnboarding(false);
        }}
      />
    </>
  );
}
