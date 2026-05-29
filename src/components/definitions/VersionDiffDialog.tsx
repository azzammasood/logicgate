"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[var(--surface,#161920)] text-[var(--fg)] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Changes in v{version}</DialogTitle>
          <DialogDescription className="text-[var(--fg-muted)]">
            {prevVersion ? `Compared with v${prevVersion}` : "Initial version — nothing to compare."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[140px_1fr_1fr] gap-2 px-2 text-[10px] uppercase tracking-wide text-[var(--fg-muted)]">
          <span>Field</span>
          <span>Before</span>
          <span>After</span>
        </div>

        {onlyChanged.length === 0 && prevVersion && (
          <p className="px-2 text-xs text-[var(--fg-muted)]">No field-level changes detected.</p>
        )}

        <div className="space-y-1">
          {onlyChanged.map((f) => (
            <div
              key={f.key}
              className="grid grid-cols-[140px_1fr_1fr] items-center gap-2 rounded-md bg-amber-400/5 px-2 py-1.5 text-xs"
            >
              <span className="text-[var(--fg-muted)]">{f.label}</span>
              <span className="truncate text-red-300 line-through">{f.before}</span>
              <span className="truncate text-[var(--accent)]">{f.after}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[140px_1fr_1fr] gap-2 px-2 pt-3 text-[10px] uppercase tracking-wide text-[var(--fg-muted)]">
          <span>Conditions</span>
          <span>{prevVersion ? `v${prevVersion}` : "—"}</span>
          <span>v{version}</span>
        </div>
        {conditionRows.length === 0 && (
          <p className="px-2 text-xs text-[var(--fg-muted)]">No conditions.</p>
        )}
        {conditionRows.map((r, i) => {
          const changed = r.before !== r.after;
          return (
            <div
              key={i}
              className={cn(
                "grid grid-cols-[140px_1fr_1fr] items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                changed ? "bg-amber-400/5" : ""
              )}
            >
              <span className="text-[var(--fg-muted)]">#{i + 1}</span>
              <span className={cn("truncate font-mono", changed && "text-red-300")}>{r.before}</span>
              <span className={cn("truncate font-mono", changed && "text-[var(--accent)]")}>{r.after}</span>
            </div>
          );
        })}
      </DialogContent>
    </Dialog>
  );
}
