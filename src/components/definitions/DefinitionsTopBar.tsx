"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitCompare, Undo2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUiStore } from "@/stores/ui";
import { Button } from "@/components/ui/button";
import { ChangeRequestDialog } from "@/components/definitions/ChangeRequestDialog";
import { CompareDialog } from "@/components/definitions/CompareDialog";
import { PublishDialog } from "@/components/definitions/PublishDialog";

function useDefinitionId() {
  const pathname = usePathname();
  return pathname.match(/\/app\/definitions\/([^/]+)/)?.[1] ?? null;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  PUBLISHED: { label: "Published", color: "var(--accent)" },
  PENDING_REVIEW: { label: "In review", color: "#fbbf24" },
  DRAFT: { label: "Draft", color: "#8b93a1" },
  DEPRECATED: { label: "Deprecated", color: "#f87171" },
};

export function DefinitionsTopBar() {
  const definitionId = useDefinitionId();
  const qc = useQueryClient();
  const [compareOpen, setCompareOpen] = useState(false);
  const [changeReqOpen, setChangeReqOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const bumpDraftResetKey = useUiStore((s) => s.bumpDraftResetKey);

  const { data: definition } = useQuery({
    queryKey: ["definition", definitionId],
    queryFn: async () => {
      const res = await fetch(`/api/definitions/${definitionId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    enabled: !!definitionId,
  });

  const discard = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/definitions/${definitionId}/discard`, { method: "POST" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as { version: number };
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ["definition", definitionId] });
      qc.invalidateQueries({ queryKey: ["pseudocode", definitionId] });
      bumpDraftResetKey();
      setDiscardOpen(false);
      toast.success(`Reverted to v${data.version}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Autosave writes edits straight to the definition; this flags when they
  // differ from the last published version (and allows throwing them away).
  const unpublished = !!definition?.hasUnpublishedChanges;
  const canDiscard = unpublished && (definition?.versions?.length ?? 0) > 0;

  const proposedSnapshot = definition
    ? {
        name: definition.name,
        type: definition.type,
        sourceTable: definition.sourceTable,
        sourceValueField: definition.sourceValueField,
        sourceDateField: definition.sourceDateField,
        currency: definition.currency,
        aggregationFn: definition.aggregationFn,
        groupByPeriod: definition.groupByPeriod,
        dedupeBy: definition.dedupeBy,
        dedupeStrategy: definition.dedupeStrategy,
        conditions: definition.conditions ?? [],
      }
    : null;

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between gap-3 border-b border-[var(--border-color)] bg-[#0a0c10] px-5">
      <nav className="flex min-w-0 items-center gap-3 text-xs">
        <Link href="/app/definitions" className="text-[var(--text3)] hover:text-[var(--fg)]">
          Definitions
        </Link>
        {definition?.group?.name && (
          <span className="truncate font-medium text-[var(--fg)]">{definition.group.name}</span>
        )}
        {definition?.name && (
          <span className="truncate font-medium text-[var(--accent)]">{definition.name}</span>
        )}
      </nav>

      {definition && (
        <div className="flex shrink-0 items-center gap-2">
          {(() => {
            const meta = STATUS_META[definition.status] ?? STATUS_META.DRAFT;
            return (
              <span
                className="hidden items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--background,#0d0f14)] px-2.5 py-[5px] text-[11px] text-[var(--text2)] sm:flex"
                title={`Version ${definition.currentVersion} · ${meta.label}`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: meta.color }}
                />
                v{definition.currentVersion} — <span style={{ color: meta.color }}>{meta.label}</span>
              </span>
            );
          })()}
          {unpublished && (
            <span
              className="hidden items-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-2.5 py-[5px] text-[11px] text-amber-300 md:flex"
              title="These edits are saved as a draft. They aren't live until you publish or they're approved."
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Unpublished changes
            </span>
          )}
          {canDiscard && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 rounded-lg border-[var(--border2)] bg-transparent px-3 text-[11px] text-[var(--text2)] hover:bg-[var(--surface2)] hover:text-[var(--fg)]"
              onClick={() => setDiscardOpen(true)}
            >
              <Undo2 className="mr-1 h-3.5 w-3.5" />
              Discard
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded-lg border-[var(--border2)] bg-transparent px-3.5 text-[11px] text-[var(--text2)] hover:bg-[var(--surface2)] hover:text-[var(--fg)]"
            onClick={() => setCompareOpen(true)}
          >
            <GitCompare className="mr-1 h-3.5 w-3.5" />
            Compare
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded-lg border-amber-400/30 bg-[var(--amber-dim)] px-3.5 text-[11px] text-[var(--amber)] hover:bg-amber-400/20 hover:text-amber-200"
            onClick={() => setChangeReqOpen(true)}
          >
            Request Review
          </Button>
          <Button
            size="sm"
            className="h-7 rounded-lg bg-[var(--accent)] px-3.5 text-[11px] font-medium text-[#0d1208] hover:opacity-90"
            onClick={() => setPublishOpen(true)}
          >
            Publish
          </Button>
        </div>
      )}

      {definitionId && (
        <CompareDialog open={compareOpen} onOpenChange={setCompareOpen} definitionId={definitionId} />
      )}
      {definitionId && (
        <PublishDialog
          open={publishOpen}
          onOpenChange={setPublishOpen}
          definitionId={definitionId}
          definitionName={definition?.name}
        />
      )}
      {definitionId && proposedSnapshot && (
        <ChangeRequestDialog
          open={changeReqOpen}
          onOpenChange={setChangeReqOpen}
          definitionId={definitionId}
          proposedSnapshot={proposedSnapshot}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["definition", definitionId] })}
        />
      )}
      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent className="border-white/10 bg-[var(--surface,#161920)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discard unpublished changes?</DialogTitle>
            <DialogDescription className="text-[var(--fg-muted)]">
              {definition?.name ?? "This definition"} goes back to v
              {definition?.versions?.[0]?.version ?? definition?.currentVersion}, the last
              published version. Your draft edits can&apos;t be recovered.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDiscardOpen(false)}>
              Keep editing
            </Button>
            <Button
              className="bg-red-500/90 text-white hover:bg-red-500"
              disabled={discard.isPending}
              onClick={() => discard.mutate()}
            >
              {discard.isPending ? "Discarding…" : "Discard changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
