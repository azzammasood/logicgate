"use client";

import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Settings } from "lucide-react";
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
  const pathname = usePathname();
  const router = useRouter();

  function switchWorkspace(id: string) {
    if (id === workspaceId) return;
    setWorkspace(id);
    // A record open on the current URL belongs to the old workspace — leave it.
    if (/^\/app\/definitions\/[^/]+/.test(pathname)) {
      router.push("/app/definitions");
    }
  }

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await fetch("/api/workspaces");
      const json = await res.json();
      return json.data ?? [];
    },
  });

  type Org = { id: string; name: string; logoUrl?: string | null; role?: string };
  const [details, setDetails] = useState<{ org: Org; top: number } | null>(null);

  function handleTile(w: Org, e: ReactMouseEvent<HTMLElement>) {
    if (w.id === workspaceId) {
      const top = e.currentTarget.getBoundingClientRect().top;
      setDetails((d) => (d?.org.id === w.id ? null : { org: w, top }));
    } else {
      switchWorkspace(w.id);
      setDetails(null);
    }
  }

  return (
    <>
      <aside className="hidden w-12 shrink-0 flex-col items-center gap-2 border-r border-white/10 bg-[#0a0c10] py-3 md:flex">
        {/* overflow-y-auto also clips horizontally, which shaved the active
            tile's ring and the scrollbar off the rail — pad it and hide the bar. */}
        <div className="flex w-full flex-1 flex-col items-center gap-1.5 overflow-y-auto px-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {workspaces.map((w: Org) => {
            const active = w.id === workspaceId;
            return (
              <Tooltip key={w.id}>
                <TooltipTrigger
                  onClick={(e) => handleTile(w, e)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg p-0.5 text-[10px] font-semibold outline-none transition-[background,color,box-shadow] duration-150",
                    active
                      ? "bg-[var(--accent,#4ade80)]/20 text-[var(--accent,#4ade80)] ring-2 ring-[var(--accent,#4ade80)]/50"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {w.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={w.logoUrl}
                      alt={w.name}
                      className="h-full w-full rounded-md object-contain"
                    />
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
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-white/15 text-white/40 outline-none transition-colors duration-150 hover:border-[var(--accent,#4ade80)]/40 hover:bg-[var(--accent,#4ade80)]/5 hover:text-[var(--accent,#4ade80)]"
            >
              <Plus className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent side="right">Create or join an organization</TooltipContent>
          </Tooltip>
        </div>
      </aside>

      {/* Org details popover — blurred backdrop, anchored beside the rail. */}
      {details && (
        <div
          className="fixed inset-0 z-[120]"
          onClick={() => setDetails(null)}
          role="presentation"
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ top: Math.max(12, details.top) }}
            className="lg-pop absolute left-[3.75rem] w-64 rounded-xl border border-white/10 bg-[var(--surface,#161920)] p-4 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--accent,#4ade80)]/15 text-sm font-semibold text-[var(--accent,#4ade80)]">
                {details.org.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={details.org.logoUrl} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  orgInitials(details.org.name)
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{details.org.name}</p>
                <p className="text-[11px] text-white/40">
                  {details.org.role ? `${details.org.role.toLowerCase()} · ` : ""}Organization
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                router.push("/app/settings");
                setDetails(null);
              }}
              className="hover-glow mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-[var(--background,#0d0f14)] py-2 text-xs font-medium text-white/80"
            >
              <Settings className="h-3.5 w-3.5" />
              Edit organization
            </button>
          </div>
        </div>
      )}

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
