"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { actionOverlay } from "@/stores/actionOverlay";
import { toast } from "sonner";

type ChangeRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definitionId: string;
  proposedSnapshot: Record<string, unknown>;
  onSuccess?: () => void;
};

const MIN_REASON = 20;

export function ChangeRequestDialog({
  open,
  onOpenChange,
  definitionId,
  proposedSnapshot,
  onSuccess,
}: ChangeRequestDialogProps) {
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          definitionId,
          proposedSnapshot,
          changeDescription: reason.trim(),
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onMutate: () => actionOverlay.show("Submitting change request"),
    onSettled: () => actionOverlay.hide(),
    onSuccess: () => {
      setReason("");
      onOpenChange(false);
      toast.success("Change request submitted");
      onSuccess?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const valid = reason.trim().length >= MIN_REASON;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#161920]">
        <DialogHeader>
          <DialogTitle>Submit change request</DialogTitle>
          <DialogDescription>
            Describe why this change is needed (minimum {MIN_REASON} characters). An approver will
            review before publish.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Reason for change…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="bg-[#0d0f14]"
        />
        <p className="text-xs text-white/40">
          {reason.trim().length}/{MIN_REASON} characters
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#4ade80] text-black"
            disabled={!valid || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
