"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Plus, Minus, PencilLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Snapshot = {
  definition?: Record<string, unknown>;
  conditions?: { field: string; operator: string; value: string | null; connector: string }[];
};

const FIELDS: { key: string; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  { key: "type", label: "Type" },
  { key: "sourceTable", label: "Source table" },
  { key: "sourceValueField", label: "Value field" },
  { key: "sourceDateField", label: "Date field" },
  { key: "currency", label: "Currency" },
  { key: "aggregationFn", label: "Aggregation" },
  { key: "groupByPeriod", label: "Group by" },
  { key: "dedupeBy", label: "Dedupe by" },
  { key: "dedupeStrategy", label: "Dedupe strategy" },
  { key: "status", label: "Status" },
];

async function fetchSnapshot(definitionId: string, version: number): Promise<Snapshot | null> {
  const res = await fetch(`/api/definitions/${definitionId}/versions/${version}`);
  const json = await res.json();
  return (json.data?.snapshot ?? null) as Snapshot | null;
}

function val(s: Snapshot | null | undefined, key: string) {
  const v = s?.definition?.[key];
  return v === null || v === undefined || v === "" ? "—" : String(v);
}

function condText(c: { field: string; operator: string; value: string | null; connector: string }) {
  return `${c.connector} ${c.field} ${c.operator} ${c.value ?? ""}`.trim();
}

export function VersionDiffDialog({
  open,
  onOpenChange,
  definitionId,
  version,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definitionId: string;
  version: number | null;
}) {
  const prevVersion = version != null && version > 1 ? version - 1 : null;

  const { data: curSnap } = useQuery({
    queryKey: ["version-snapshot", definitionId, version],
    queryFn: () => fetchSnapshot(definitionId, version!),
    enabled: open && version != null,
  });
  const { data: prevSnap } = useQuery({
    queryKey: ["version-snapshot", definitionId, prevVersion],
    queryFn: () => fetchSnapshot(definitionId, prevVersion!),
    enabled: open && prevVersion != null,
  });

  const changedFields = useMemo(
    () => FIELDS.map((f) => ({ ...f, before: val(prevSnap, f.key), after: val(curSnap, f.key) })),
    [prevSnap, curSnap]
  );

  const conditionRows = useMemo(() => {
    const a = (prevSnap?.conditions ?? []).map(condText);
    const b = (curSnap?.conditions ?? []).map(condText);
    const max = Math.max(a.length, b.length);
    return Array.from({ length: max }, (_, i) => ({ before: a[i] ?? "—", after: b[i] ?? "—" }));
  }, [prevSnap, curSnap]);

  const onlyChanged = changedFields.filter((f) => f.before !== f.after);
  const condChanges = conditionRows.filter((r) => r.before !== r.after);
  const totalChanges = onlyChanged.length + condChanges.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[var(--surface,#161920)] text-[var(--fg)] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Changes in v{version}</DialogTitle>
          <DialogDescription className="text-[var(--fg-muted)]">
            {prevVersion ? `Compared with v${prevVersion}` : "Initial version — nothing to compare."}
          </DialogDescription>
        </DialogHeader>

        {/* Change summary */}
        {prevVersion && (
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
                totalChanges === 0
                  ? "bg-white/5 text-white/50"
                  : "bg-amber-400/10 text-amber-300"
              )}
            >
              <PencilLine className="h-3 w-3" />
              {totalChanges === 0 ? "No changes" : `${totalChanges} change${totalChanges === 1 ? "" : "s"}`}
            </span>
            {onlyChanged.length > 0 && (
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/50">
                {onlyChanged.length} field{onlyChanged.length === 1 ? "" : "s"}
              </span>
            )}
            {condChanges.length > 0 && (
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-white/50">
                {condChanges.length} condition{condChanges.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        )}

        {/* Field changes */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
            Fields
          </p>
          {onlyChanged.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-center text-xs text-[var(--fg-muted)]">
              No field-level changes.
            </p>
          ) : (
            <div className="space-y-1.5">
              {onlyChanged.map((f) => (
                <div
                  key={f.key}
                  className="rounded-lg border-l-2 border-amber-400/60 bg-white/[0.02] px-3 py-2"
                >
                  <p className="text-[10px] uppercase tracking-wide text-[var(--fg-muted)]">{f.label}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="max-w-full truncate rounded bg-red-500/10 px-1.5 py-0.5 text-red-300 line-through">
                      {f.before}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/30" />
                    <span className="max-w-full truncate rounded bg-[var(--accent)]/10 px-1.5 py-0.5 text-[var(--accent)]">
                      {f.after}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Condition changes */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
            Conditions
          </p>
          {conditionRows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-center text-xs text-[var(--fg-muted)]">
              No conditions.
            </p>
          ) : (
            <div className="space-y-1">
              {conditionRows.map((r, i) => {
                const added = r.before === "—" && r.after !== "—";
                const removed = r.after === "—" && r.before !== "—";
                const changed = r.before !== r.after;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-1.5 font-mono text-xs",
                      added && "bg-[var(--accent)]/[0.07]",
                      removed && "bg-red-500/[0.07]",
                      changed && !added && !removed && "bg-amber-400/[0.06]",
                      !changed && "opacity-60"
                    )}
                  >
                    <span className="shrink-0">
                      {added ? (
                        <Plus className="h-3.5 w-3.5 text-[var(--accent)]" />
                      ) : removed ? (
                        <Minus className="h-3.5 w-3.5 text-red-400" />
                      ) : (
                        <span className="inline-block h-3.5 w-3.5 text-center text-white/25">·</span>
                      )}
                    </span>
                    {added ? (
                      <span className="truncate text-[var(--accent)]">{r.after}</span>
                    ) : removed ? (
                      <span className="truncate text-red-300 line-through">{r.before}</span>
                    ) : changed ? (
                      <span className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="truncate text-red-300 line-through">{r.before}</span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-white/30" />
                        <span className="truncate text-[var(--accent)]">{r.after}</span>
                      </span>
                    ) : (
                      <span className="truncate text-white/60">{r.after}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
