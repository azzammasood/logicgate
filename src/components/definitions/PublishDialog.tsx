"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { suggestChangeReason } from "@/lib/ai/assist";
import { actionOverlay } from "@/stores/actionOverlay";
import { toast } from "sonner";

export function PublishDialog({
  open,
  onOpenChange,
  definitionId,
  definitionName,
  onPublished,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definitionId: string;
  definitionName?: string;
  onPublished?: () => void;
}) {
  const qc = useQueryClient();
  const [message, setMessage] = useState("");

  const publish = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/definitions/${definitionId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onMutate: () => actionOverlay.show("Publishing definition"),
    onSettled: () => actionOverlay.hide(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["definition", definitionId] });
      qc.invalidateQueries({ queryKey: ["definitions"] });
      qc.invalidateQueries({ queryKey: ["versions", definitionId] });
      toast.success("Definition published");
      setMessage("");
      onOpenChange(false);
      onPublished?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[var(--surface,#161920)] text-[var(--fg)]">
        <DialogHeader>
          <DialogTitle>Publish {definitionName ?? "definition"}</DialogTitle>
          <DialogDescription className="text-[var(--fg-muted)]">
            Publishing records a new version in history. Describe what changed, like a commit message.
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs text-[var(--fg-muted)]">Change reason</label>
            <AiAssistButton
              label="Suggest with AI"
              loadingLabel="Writing…"
              onRun={async (cfg) => {
                const reason = await suggestChangeReason(definitionId, cfg);
                if (reason) setMessage(reason);
              }}
            />
          </div>
          <Textarea
            autoFocus
            placeholder="e.g. Added trial-user exclusion to revenue rule"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px] bg-[var(--background,#0d0f14)]"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[var(--accent)] text-black hover:opacity-90"
            disabled={publish.isPending || message.trim().length === 0}
            onClick={() => publish.mutate()}
          >
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
