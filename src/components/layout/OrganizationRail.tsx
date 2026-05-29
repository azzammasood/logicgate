"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateWorkspaceDialog } from "@/components/onboarding/CreateWorkspaceDialog";

function orgInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function OrganizationRail() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await fetch("/api/workspaces");
      const json = await res.json();
      return json.data ?? [];
    },
  });

  return (
    <>
      <aside className="hidden w-16 shrink-0 flex-col items-center gap-3 border-r border-white/10 bg-[#0a0c10] py-3 md:flex">
        <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto">
          {workspaces.map((w: { id: string; name: string; logoUrl?: string | null }) => {
            const active = w.id === workspaceId;
            return (
              <Tooltip key={w.id}>
                <TooltipTrigger
                  onClick={() => setWorkspace(w.id)}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg text-xs font-semibold outline-none transition-colors",
                    active
                      ? "bg-[var(--accent,#4ade80)]/20 text-[var(--accent,#4ade80)] ring-1 ring-[var(--accent,#4ade80)]/40"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {w.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.logoUrl} alt={w.name} className="h-full w-full object-cover" />
                  ) : (
                    orgInitials(w.name)
                  )}
                </TooltipTrigger>
                <TooltipContent side="right">{w.name}</TooltipContent>
              </Tooltip>
            );
          })}

          <Tooltip>
            <TooltipTrigger
              onClick={() => setCreateOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-white/15 text-white/40 outline-none transition-colors hover:border-[var(--accent,#4ade80)]/40 hover:text-[var(--accent,#4ade80)]"
            >
              <Plus className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="right">New organization</TooltipContent>
          </Tooltip>
        </div>
      </aside>

      <CreateWorkspaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => {
          setWorkspace(id);
          setCreateOpen(false);
        }}
      />
    </>
  );
}
