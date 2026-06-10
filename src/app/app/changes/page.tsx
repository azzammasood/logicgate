"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Topbar } from "@/components/layout/Topbar";
import { PageLoader } from "@/components/layout/PageLoader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChangeRequestDetailModal } from "@/components/changes/ChangeRequestDetailModal";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { useWorkspaceStore } from "@/stores/workspace";
import { cn } from "@/lib/utils";

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

type ChangeRequestRow = {
  id: string;
  status: string;
  changeDescription: string;
  createdAt: string;
  definition: { id: string; name: string; type: string; approverId?: string | null };
  requestedBy: { name: string; email: string };
  reviewedBy?: { name: string } | null;
  reviewNote?: string | null;
};

export default function ReviewsPage() {
  const searchParams = useSearchParams();
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const viewParam = searchParams.get("view");
  const [view, setView] = useState<"assigned" | "all">(
    viewParam === "assigned" ? "assigned" : "all"
  );
  const [statusTab, setStatusTab] = useState<string>("PENDING");
  const [selected, setSelected] = useState<ChangeRequestRow | null>(null);

  useEffect(() => {
    if (viewParam === "assigned") setView("assigned");
    else if (viewParam === "all") setView("all");
  }, [viewParam]);

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/sync", { method: "POST" });
      const json = await res.json();
      return json.data as { id: string };
    },
  });

  const effectiveStatus = view === "assigned" ? "PENDING" : statusTab;

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["change-requests", workspaceId, view, effectiveStatus, currentUser?.id],
    queryFn: async () => {
      const params = new URLSearchParams({
        workspaceId: workspaceId!,
        status: effectiveStatus,
      });
      if (view === "assigned" && currentUser?.id) {
        params.set("approverId", currentUser.id);
      }
      const res = await fetch(`/api/change-requests?${params}`);
      const json = await res.json();
      return (json.data ?? []) as ChangeRequestRow[];
    },
    enabled: !!workspaceId && (view === "all" || !!currentUser?.id),
  });

  const statusColor: Record<string, string> = {
    PENDING: "bg-amber-500/20 text-amber-400",
    APPROVED: "bg-[#4ade80]/20 text-[#4ade80]",
    REJECTED: "bg-red-500/20 text-red-400",
  };

  const canReviewSelected =
    selected?.status === "PENDING" &&
    !!currentUser?.id &&
    selected.definition.approverId === currentUser.id;

  return (
    <div className="flex h-full flex-col bg-[#0d0f14]">
      <Topbar title="Reviews" />
      <PageLoader active={isLoading} message="Loading reviews…" />
      <div className="border-b border-white/10 px-6 pt-4">
        <Tabs value={view} onValueChange={(v) => setView(v as "assigned" | "all")}>
          <TabsList className="bg-[#161920]">
            <TabsTrigger value="all">All requests</TabsTrigger>
            <TabsTrigger value="assigned">Needs my review</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "all" && (
        <Tabs value={statusTab} onValueChange={setStatusTab} className="flex flex-1 flex-col">
          <TabsList className="mx-6 mt-4 w-fit bg-[#161920]">
            {STATUSES.map((s) => (
              <TabsTrigger key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </TabsTrigger>
            ))}
          </TabsList>
          {STATUSES.map((s) => (
            <TabsContent key={s} value={s} className="flex-1 overflow-y-auto p-6">
              {statusTab === s && (
                <RequestList {...{ requests, isLoading, statusColor, setSelected }} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {view === "assigned" && (
        <div className="flex-1 overflow-y-auto p-6">
          <RequestList {...{ requests, isLoading, statusColor, setSelected }} />
        </div>
      )}

      <ChangeRequestDetailModal
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        request={selected}
        canReview={!!canReviewSelected}
      />
    </div>
  );
}

function RequestList({
  requests,
  isLoading,
  statusColor,
  setSelected,
}: {
  requests: ChangeRequestRow[];
  isLoading: boolean;
  statusColor: Record<string, string>;
  setSelected: (r: ChangeRequestRow) => void;
}) {
  return (
    <>
      {isLoading && <ListSkeleton />}
      {!isLoading && requests.length === 0 && <EmptyState variant="no-changes" />}
      <div className="space-y-2">
        {requests.map((cr) => (
          <button
            key={cr.id}
            type="button"
            onClick={() => setSelected(cr)}
            className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#161920] p-4 text-left hover:border-[#4ade80]/30"
          >
            <div>
              <p className="font-medium">{cr.definition.name}</p>
              <p className="mt-1 line-clamp-1 text-sm text-white/50">{cr.changeDescription}</p>
              <p className="mt-1 text-xs text-white/30">
                {cr.requestedBy.name} ·{" "}
                {formatDistanceToNow(new Date(cr.createdAt), { addSuffix: true })}
              </p>
            </div>
            <Badge className={cn(statusColor[cr.status])}>{cr.status}</Badge>
          </button>
        ))}
      </div>
    </>
  );
}
