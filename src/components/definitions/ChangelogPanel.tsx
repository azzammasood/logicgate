"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VersionDiffDialog } from "@/components/definitions/VersionDiffDialog";
import { actionOverlay } from "@/stores/actionOverlay";
import { toast } from "sonner";

type ChangelogPanelProps = {
  definitionId: string;
  onRestored?: () => void;
};

export function ChangelogPanel({ definitionId, onRestored }: ChangelogPanelProps) {
  const qc = useQueryClient();
  const [restoreVersion, setRestoreVersion] = useState<number | null>(null);
  const [diffVersion, setDiffVersion] = useState<number | null>(null);

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["versions", definitionId],
    queryFn: async () => {
      const res = await fetch(`/api/definitions/${definitionId}/versions`);
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!definitionId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const restoreMutation = useMutation({
    mutationFn: async (version: number) => {
      const res = await fetch(
        `/api/definitions/${definitionId}/versions/${version}/restore`,
        { method: "POST" }
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onMutate: () => actionOverlay.show("Restoring version"),
    onSettled: () => actionOverlay.hide(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["definition", definitionId] });
      qc.invalidateQueries({ queryKey: ["versions", definitionId] });
      setRestoreVersion(null);
      toast.success("Version restored");
      onRestored?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3 p-6">
      {isLoading &&
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="lg-skeleton h-[72px] rounded-lg" />
        ))}
      {versions.map(
        (v: {
          version: number;
          changeDescription: string;
          documentation?: string | null;
          createdAt: string;
          changedBy: { name: string; avatarInitials: string };
        }) => (
          <div
            key={v.version}
            className="flex items-start justify-between gap-4 rounded-lg border border-[var(--border-color)] bg-[var(--surface,#161920)] p-4 transition-colors duration-150 hover:border-white/20"
          >
            <button
              type="button"
              onClick={() => setDiffVersion(v.version)}
              className="group flex flex-1 gap-3 text-left"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="flex items-center justify-center bg-[var(--accent)]/15 text-[10px] font-semibold leading-none text-[var(--accent)]">
                  {v.changedBy?.avatarInitials ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-[var(--fg)]">v{v.version}</p>
                <p className="text-sm text-[var(--fg)]/80">{v.changeDescription}</p>
                {v.documentation?.trim() && (
                  <p className="mt-2 whitespace-pre-wrap rounded-md border border-[var(--border-color)] bg-[var(--background,#0d0f14)]/60 px-2.5 py-2 text-xs leading-relaxed text-[var(--fg)]/75">
                    {v.documentation}
                  </p>
                )}
                <p className="mt-1 text-xs text-[var(--fg-muted)]">
                  {v.changedBy?.name} ·{" "}
                  {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })} ·{" "}
                  <span className="text-[var(--fg-muted)] transition-colors group-hover:text-[var(--accent)]">
                    view changes
                  </span>
                </p>
              </div>
            </button>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-[var(--border-color)]"
              onClick={() => setRestoreVersion(v.version)}
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Restore
            </Button>
          </div>
        )
      )}
      {!isLoading && versions.length === 0 && (
        <p className="text-sm text-[var(--fg-muted)]">No version history yet.</p>
      )}

      <Dialog open={restoreVersion !== null} onOpenChange={() => setRestoreVersion(null)}>
        <DialogContent className="border-white/10 bg-[var(--surface,#161920)] text-[var(--fg)]">
          <DialogHeader>
            <DialogTitle>Restore version {restoreVersion}?</DialogTitle>
            <DialogDescription className="text-[var(--fg-muted)]">
              This will replace the current definition with the selected snapshot. A new version
              will be recorded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRestoreVersion(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[var(--accent)] text-black"
              disabled={restoreMutation.isPending}
              onClick={() => restoreVersion != null && restoreMutation.mutate(restoreVersion)}
            >
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VersionDiffDialog
        open={diffVersion !== null}
        onOpenChange={(o) => !o && setDiffVersion(null)}
        definitionId={definitionId}
        version={diffVersion}
      />
    </div>
  );
}
