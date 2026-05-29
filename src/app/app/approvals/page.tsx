"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/badge";
import { ChangeRequestDetailModal } from "@/components/changes/ChangeRequestDetailModal";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { useWorkspaceStore } from "@/stores/workspace";

export default function ApprovalsPage() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [selected, setSelected] = useState<{
    id: string;
    status: string;
    changeDescription: string;
    createdAt: string;
    definition: { id: string; name: string; type: string };
    requestedBy: { name: string; email: string };
  } | null>(null);

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/sync", { method: "POST" });
      const json = await res.json();
      return json.data;
    },
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["approvals", workspaceId, currentUser?.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/change-requests?workspaceId=${workspaceId}&status=PENDING&approverId=${currentUser!.id}`
      );
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!workspaceId && !!currentUser?.id,
  });

  return (
    <div className="flex h-full flex-col bg-[#0d0f14]">
      <Topbar title="Approvals" />
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && <ListSkeleton />}
        {!isLoading && requests.length === 0 && (
          <EmptyState variant="no-changes" />
        )}
        <div className="space-y-2">
          {requests.map(
            (cr: {
              id: string;
              changeDescription: string;
              createdAt: string;
              definition: { name: string };
              requestedBy: { name: string };
            }) => (
              <button
                key={cr.id}
                type="button"
                onClick={() => setSelected(cr as typeof selected)}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#161920] p-4 text-left hover:border-[#4ade80]/30"
              >
                <div>
                  <p className="font-medium">{cr.definition.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-white/50">{cr.changeDescription}</p>
                  <p className="mt-1 text-xs text-white/30">
                    {cr.requestedBy.name} ·{" "}
                    {formatDistanceToNow(new Date(cr.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <Badge className="bg-amber-500/20 text-amber-400">PENDING</Badge>
              </button>
            )
          )}
        </div>
      </div>
      <ChangeRequestDetailModal
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        request={selected}
        canReview
      />
    </div>
  );
}
