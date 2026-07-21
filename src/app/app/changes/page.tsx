"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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

type Cond = { field: string; operator: string; value: string | null };

type DefFields = {
  id: string;
  name: string;
  type: string;
  approverId?: string | null;
  sourceTable?: string | null;
  sourceValueField?: string | null;
  aggregationFn?: string | null;
  groupByPeriod?: string | null;
  currency?: string | null;
  conditions?: Cond[];
};

type ChangeRequestRow = {
  id: string;
  status: string;
  changeDescription: string;
  createdAt: string;
  definition: DefFields;
  proposedSnapshot?: { definition?: Partial<DefFields>; conditions?: Cond[] } | null;
  requestedBy: { name: string; email: string };
  reviewedBy?: { name: string } | null;
  reviewNote?: string | null;
};

// Fields we can diff from the row payload (proposed snapshot vs current definition).
const DIFF_FIELDS: [keyof DefFields, string][] = [
  ["type", "type"],
  ["sourceTable", "source"],
  ["sourceValueField", "value"],
  ["aggregationFn", "aggregation"],
  ["groupByPeriod", "group by"],
  ["currency", "currency"],
];

function pretty(v: unknown): string {
  if (v == null || v === "") return "none";
  return String(v).toLowerCase().replace(/_/g, " ");
}

function condMap(list: Cond[] | undefined): Map<string, string> {
  const m = new Map<string, string>();
  for (const c of list ?? []) {
    m.set(c.field, `${c.operator.toLowerCase().replace(/_/g, " ")} ${pretty(c.value)}`);
  }
  return m;
}

function computeDiff(cr: ChangeRequestRow) {
  const proposed = cr.proposedSnapshot?.definition;
  const diffs: { label: string; from: string; to: string }[] = [];
  if (proposed) {
    for (const [key, label] of DIFF_FIELDS) {
      const from = cr.definition[key] ?? null;
      const to = proposed[key] ?? null;
      if (String(from ?? "") !== String(to ?? "")) {
        diffs.push({ label, from: pretty(from), to: pretty(to) });
      }
    }
  }
  // Condition changes (added / removed / value-changed) — the common case.
  const cur = condMap(cr.definition.conditions);
  const next = condMap(cr.proposedSnapshot?.conditions);
  const fields = new Set([...cur.keys(), ...next.keys()]);
  for (const f of fields) {
    const a = cur.get(f);
    const b = next.get(f);
    if (a === b) continue;
    if (a && b) diffs.push({ label: f, from: a, to: b });
    else if (b) diffs.push({ label: f, from: "—", to: b });
    else if (a) diffs.push({ label: f, from: a, to: "removed" });
  }
  return diffs;
}

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
      <div className="lg-stagger space-y-2">
        {requests.map((cr) => (
          <button
            key={cr.id}
            type="button"
            onClick={() => setSelected(cr)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#161920] p-4 text-left transition-colors hover:border-white/20 hover:bg-[#1a1e29]"
          >
            <div className="min-w-0">
              <p className="font-medium">{cr.definition.name}</p>
              <p className="mt-1 line-clamp-1 text-sm text-white/50">{cr.changeDescription}</p>
              {(() => {
                const diffs = computeDiff(cr);
                if (diffs.length === 0) return null;
                return (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {diffs.slice(0, 3).map((d) => (
                      <span
                        key={d.label}
                        className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-white/50"
                      >
                        {d.label}: <span className="text-white/40 line-through">{d.from}</span>
                        <span className="text-[var(--accent)]">→ {d.to}</span>
                      </span>
                    ))}
                    {diffs.length > 3 && (
                      <span className="text-[10px] text-white/30">
                        +{diffs.length - 3} more
                      </span>
                    )}
                  </div>
                );
              })()}
              <p className="mt-1.5 text-xs text-white/30">
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
