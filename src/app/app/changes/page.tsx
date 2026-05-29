"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Topbar } from "@/components/layout/Topbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChangeRequestDetailModal } from "@/components/changes/ChangeRequestDetailModal";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { useWorkspaceStore } from "@/stores/workspace";
import { cn } from "@/lib/utils";

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export default function ChangesPage() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [tab, setTab] = useState<string>("PENDING");
  const [selected, setSelected] = useState<unknown>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["change-requests", workspaceId, tab],
    queryFn: async () => {
      const res = await fetch(
        `/api/change-requests?workspaceId=${workspaceId}&status=${tab}`
      );
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!workspaceId,
  });

  const statusColor: Record<string, string> = {
    PENDING: "bg-amber-500/20 text-amber-400",
    APPROVED: "bg-[#4ade80]/20 text-[#4ade80]",
    REJECTED: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="flex h-full flex-col bg-[#0d0f14]">
      <Topbar title="Change Requests" />
      <Tabs value={tab} onValueChange={setTab} className="flex flex-1 flex-col">
        <TabsList className="mx-6 mt-4 w-fit bg-[#161920]">
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </TabsTrigger>
          ))}
        </TabsList>
        {STATUSES.map((s) => (
          <TabsContent key={s} value={s} className="flex-1 overflow-y-auto p-6">
            {isLoading && <ListSkeleton />}
            {!isLoading && requests.length === 0 && <EmptyState variant="no-changes" />}
            <div className="space-y-2">
              {requests.map(
                (cr: {
                  id: string;
                  status: string;
                  changeDescription: string;
                  createdAt: string;
                  definition: { name: string; type: string };
                  requestedBy: { name: string };
                }) => (
                  <button
                    key={cr.id}
                    type="button"
                    onClick={() => setSelected(cr)}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#161920] p-4 text-left hover:border-[#4ade80]/30"
                  >
                    <div>
                      <p className="font-medium">{cr.definition.name}</p>
                      <p className="mt-1 line-clamp-1 text-sm text-white/50">
                        {cr.changeDescription}
                      </p>
                      <p className="mt-1 text-xs text-white/30">
                        {cr.requestedBy.name} ·{" "}
                        {formatDistanceToNow(new Date(cr.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge className={cn(statusColor[cr.status])}>{cr.status}</Badge>
                  </button>
                )
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <ChangeRequestDetailModal
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        request={selected as Parameters<typeof ChangeRequestDetailModal>[0]["request"]}
      />
    </div>
  );
}
