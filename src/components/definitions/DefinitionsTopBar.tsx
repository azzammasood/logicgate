"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, GitCompare } from "lucide-react";
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
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--border-color)] bg-[var(--surface,#161920)]/80 px-5 backdrop-blur">
      <nav className="flex min-w-0 items-center gap-1.5 text-sm">
        <Link href="/app/definitions" className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
          Definitions
        </Link>
        {definition?.group?.name && (
          <>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--fg-muted)]" />
            <span className="truncate text-[var(--fg-muted)]">{definition.group.name}</span>
          </>
        )}
        {definition?.name && (
          <>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--fg-muted)]" />
            <span className="truncate font-medium text-[var(--accent)]">{definition.name}</span>
          </>
        )}
      </nav>

      {definition && (
        <div className="flex shrink-0 items-center gap-2">
          {(() => {
            const meta = STATUS_META[definition.status] ?? STATUS_META.DRAFT;
            return (
              <span
                className="hidden items-center gap-1.5 rounded-full border border-[var(--border-color)] bg-white/5 px-2.5 py-1 text-xs text-[var(--fg-muted)] sm:flex"
                title={`Version ${definition.currentVersion} · ${meta.label}`}
              >
                <span
                  className="lg-pulse-dot h-1.5 w-1.5 rounded-full"
                  style={{ background: meta.color }}
                />
                v{definition.currentVersion}
                <span className="text-[var(--border-color)]">·</span>
                <span style={{ color: meta.color }}>{meta.label}</span>
              </span>
            );
          })()}
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--fg-muted)] hover:text-[var(--fg)]"
            onClick={() => setCompareOpen(true)}
          >
            <GitCompare className="mr-1.5 h-3.5 w-3.5" />
            Compare
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-400/40 text-amber-300 hover:bg-amber-400/10 hover:text-amber-200"
            onClick={() => setChangeReqOpen(true)}
          >
            Request Review
          </Button>
          <Button
            size="sm"
            className="bg-[var(--accent)] text-black hover:opacity-90"
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
    </header>
  );
}
