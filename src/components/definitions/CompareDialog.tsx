"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Version = { version: number; changeDescription: string | null; createdAt: string };

type Snapshot = {
  definition?: Record<string, unknown>;
  conditions?: { field: string; operator: string; value: string | null; connector: string }[];
};

const FIELDS: { key: string; label: string }[] = [
  { key: "name", label: "Name" },
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

export function CompareDialog({
  open,
  onOpenChange,
  definitionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definitionId: string;
}) {
  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ["versions", definitionId],
    queryFn: async () => {
      const res = await fetch(`/api/definitions/${definitionId}/versions`);
      const json = await res.json();
      return (json.data ?? []) as Version[];
    },
    enabled: !!definitionId && open,
  });

  const [toV, setToV] = useState<number | null>(null);
  const [fromV, setFromV] = useState<number | null>(null);

  useEffect(() => {
    if (versions.length && toV === null) {
      setToV(versions[0].version);
      setFromV(versions[1]?.version ?? versions[0].version);
    }
  }, [versions, toV]);

  const { data: fromSnap, isFetching: fromFetching } = useQuery({
    queryKey: ["version-snapshot", definitionId, fromV],
    queryFn: () => fetchSnapshot(definitionId, fromV!),
    enabled: !!definitionId && fromV !== null && open,
  });
  const { data: toSnap, isFetching: toFetching } = useQuery({
    queryKey: ["version-snapshot", definitionId, toV],
    queryFn: () => fetchSnapshot(definitionId, toV!),
    enabled: !!definitionId && toV !== null && open,
  });

  const loading = versionsLoading || fromFetching || toFetching;

  const conditionRows = useMemo(() => {
    const a = (fromSnap?.conditions ?? []).map(condText);
    const b = (toSnap?.conditions ?? []).map(condText);
    const max = Math.max(a.length, b.length);
    return Array.from({ length: max }, (_, i) => ({ from: a[i] ?? "—", to: b[i] ?? "—" }));
  }, [fromSnap, toSnap]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[var(--surface,#161920)] text-[var(--fg)] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compare versions</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <Select value={fromV?.toString() ?? ""} onValueChange={(v) => setFromV(Number(v))}>
            <SelectTrigger className="w-32 bg-[var(--background,#0d0f14)]">
              <SelectValue placeholder="From" />
            </SelectTrigger>
            <SelectContent className="z-[200] border-white/10 bg-[#161920]">
              {versions.map((v) => (
                <SelectItem key={v.version} value={v.version.toString()}>
                  v{v.version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[var(--fg-muted)]">→</span>
          <Select value={toV?.toString() ?? ""} onValueChange={(v) => setToV(Number(v))}>
            <SelectTrigger className="w-32 bg-[var(--background,#0d0f14)]">
              <SelectValue placeholder="To" />
            </SelectTrigger>
            <SelectContent className="z-[200] border-white/10 bg-[#161920]">
              {versions.map((v) => (
                <SelectItem key={v.version} value={v.version.toString()}>
                  v{v.version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)]" />
            <p className="text-xs text-[var(--fg-muted)]">Loading version snapshots…</p>
          </div>
        ) : (
        <div className="mt-1 space-y-3 [animation:app-page-in_0.25s_ease-out]">
          {(() => {
            const fieldChanges = FIELDS.filter((f) => val(fromSnap, f.key) !== val(toSnap, f.key)).length;
            const condChanges = conditionRows.filter((r) => r.from !== r.to).length;
            const total = fieldChanges + condChanges;
            return (
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
                    total === 0 ? "bg-white/5 text-white/50" : "bg-amber-400/10 text-amber-300"
                  )}
                >
                  {total === 0 ? "Identical" : `${total} difference${total === 1 ? "" : "s"}`}
                </span>
                <span className="text-white/35">
                  v{fromV} → v{toV}
                </span>
              </div>
            );
          })()}

          <div>
            <div className="grid grid-cols-[130px_1fr_1fr] gap-2 px-2 pb-1 text-[10px] uppercase tracking-wide text-[var(--fg-muted)]">
              <span>Field</span>
              <span>v{fromV}</span>
              <span>v{toV}</span>
            </div>
            <div className="space-y-1">
              {FIELDS.map((f) => {
                const a = val(fromSnap, f.key);
                const b = val(toSnap, f.key);
                const changed = a !== b;
                return (
                  <div
                    key={f.key}
                    className={cn(
                      "grid grid-cols-[130px_1fr_1fr] items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                      changed ? "border-l-2 border-amber-400/60 bg-amber-400/[0.06]" : "opacity-70"
                    )}
                  >
                    <span className="text-[var(--fg-muted)]">{f.label}</span>
                    <span
                      className={cn(
                        "truncate",
                        changed
                          ? "w-fit max-w-full rounded bg-red-500/10 px-1.5 py-0.5 text-red-300 line-through"
                          : "text-white/70"
                      )}
                    >
                      {a}
                    </span>
                    <span
                      className={cn(
                        "truncate",
                        changed
                          ? "w-fit max-w-full rounded bg-[var(--accent)]/10 px-1.5 py-0.5 text-[var(--accent)]"
                          : "text-white/70"
                      )}
                    >
                      {b}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="grid grid-cols-[130px_1fr_1fr] gap-2 px-2 pb-1 text-[10px] uppercase tracking-wide text-[var(--fg-muted)]">
              <span>Conditions</span>
              <span>v{fromV}</span>
              <span>v{toV}</span>
            </div>
            {conditionRows.length === 0 ? (
              <p className="px-2 text-xs text-[var(--fg-muted)]">No conditions.</p>
            ) : (
              <div className="space-y-1">
                {conditionRows.map((r, i) => {
                  const changed = r.from !== r.to;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "grid grid-cols-[130px_1fr_1fr] items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                        changed ? "border-l-2 border-amber-400/60 bg-amber-400/[0.06]" : "opacity-70"
                      )}
                    >
                      <span className="text-[var(--fg-muted)]">#{i + 1}</span>
                      <span className={cn("truncate font-mono", changed && "text-red-300 line-through")}>{r.from}</span>
                      <span className={cn("truncate font-mono", changed && "text-[var(--accent)]")}>{r.to}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
