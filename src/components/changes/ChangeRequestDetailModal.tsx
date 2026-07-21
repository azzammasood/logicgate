"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SnapshotCompare, type Snapshot } from "@/components/definitions/SnapshotCompare";
import { toast } from "sonner";

type ChangeRequestSummary = {
  id: string;
  status: string;
  changeDescription: string;
  createdAt: string;
  reviewNote?: string | null;
  definition: { id: string; name: string; type: string; approverId?: string | null };
  requestedBy: { name: string; email: string };
  reviewedBy?: { name: string } | null;
};

type ChangeRequestDetailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ChangeRequestSummary | null;
  canReview?: boolean;
};

export function ChangeRequestDetailModal({
  open,
  onOpenChange,
  request,
  canReview = false,
}: ChangeRequestDetailModalProps) {
  const qc = useQueryClient();
  const [reviewNote, setReviewNote] = useState("");

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["change-request", request?.id],
    queryFn: async () => {
      const res = await fetch(`/api/change-requests/${request!.id}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as {
        currentSnapshot: Snapshot;
        proposedSnapshot: Snapshot;
      };
    },
    enabled: open && !!request?.id,
  });

  useEffect(() => {
    if (!open) setReviewNote("");
  }, [open]);

  const reviewMutation = useMutation({
    mutationFn: async (status: "APPROVED" | "REJECTED") => {
      const res = await fetch(`/api/change-requests/${request!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: reviewNote || undefined }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: (_, status) => {
      qc.invalidateQueries({ queryKey: ["change-requests"] });
      qc.invalidateQueries({ queryKey: ["change-request"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(status === "APPROVED" ? "Change approved" : "Change rejected");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!request) return null;

  const statusColor: Record<string, string> = {
    PENDING: "bg-amber-500/20 text-amber-400",
    APPROVED: "bg-[#4ade80]/20 text-[#4ade80]",
    REJECTED: "bg-red-500/20 text-red-400",
  };

  const mayReview = canReview && request.status === "PENDING";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden border-white/10 bg-[#161920]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {request.definition.name}
            <Badge className={statusColor[request.status]}>{request.status}</Badge>
          </DialogTitle>
          <DialogDescription>
            Requested by {request.requestedBy.name} ·{" "}
            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(90vh-12rem)] space-y-4 overflow-y-auto pr-1 text-sm">
          <div>
            <p className="text-xs text-white/40">Reason</p>
            <p className="text-white/80">{request.changeDescription}</p>
          </div>
          {request.reviewNote && (
            <div>
              <p className="text-xs text-white/40">Review note</p>
              <p className="text-white/80">{request.reviewNote}</p>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">
              Compare changes
            </p>
            {detailLoading && (
              <p className="text-xs text-white/40">Loading comparison…</p>
            )}
            {detail && (
              <div className="rounded-lg border border-white/10 bg-[#0d0f14] p-2">
                <SnapshotCompare
                  fromLabel="Current (live)"
                  toLabel="Proposed"
                  fromSnap={detail.currentSnapshot}
                  toSnap={detail.proposedSnapshot}
                  onlyChanged
                />
              </div>
            )}
          </div>

          {mayReview && (
            <Textarea
              placeholder="Optional review note…"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="bg-[#0d0f14]"
              rows={2}
            />
          )}
        </div>

        <DialogFooter>
          {mayReview ? (
            <>
              <Button
                variant="outline"
                className="border-red-500/30 text-red-400"
                disabled={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate("REJECTED")}
              >
                Reject
              </Button>
              <Button
                className="bg-[var(--accent)] text-black"
                disabled={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate("APPROVED")}
              >
                Approve
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
