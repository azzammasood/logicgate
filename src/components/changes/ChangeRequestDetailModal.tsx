"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";

type ChangeRequestDetailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: {
    id: string;
    status: string;
    changeDescription: string;
    createdAt: string;
    reviewNote?: string | null;
    definition: { id: string; name: string; type: string };
    requestedBy: { name: string; email: string };
    reviewedBy?: { name: string } | null;
  } | null;
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
      qc.invalidateQueries({ queryKey: ["approvals"] });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-white/10 bg-[#161920]">
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
        <div className="space-y-3 text-sm">
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
          {canReview && request.status === "PENDING" && (
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
          {canReview && request.status === "PENDING" ? (
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
                className="bg-[#4ade80] text-black"
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
