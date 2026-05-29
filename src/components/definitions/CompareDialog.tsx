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
  const { data: versions = [] } = useQuery({
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

  const { data: fromSnap } = useQuery({
    queryKey: ["version-snapshot", definitionId, fromV],
    queryFn: () => fetchSnapshot(definitionId, fromV!),
    enabled: !!definitionId && fromV !== null && open,
  });
  const { data: toSnap } = useQuery({
    queryKey: ["version-snapshot", definitionId, toV],
    queryFn: () => fetchSnapshot(definitionId, toV!),
    enabled: !!definitionId && toV !== null && open,
  });

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

        <div className="mt-2 space-y-1.5">
          {FIELDS.map((f) => {
            const a = val(fromSnap, f.key);
            const b = val(toSnap, f.key);
            const changed = a !== b;
            return (
              <div
                key={f.key}
                className={cn(
                  "grid grid-cols-[140px_1fr_1fr] items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                  changed ? "bg-amber-400/5" : ""
                )}
              >
                <span className="text-[var(--fg-muted)]">{f.label}</span>
                <span className={cn("truncate", changed && "text-red-300 line-through")}>{a}</span>
                <span className={cn("truncate", changed && "text-[var(--accent)]")}>{b}</span>
              </div>
            );
          })}

          <div className="grid grid-cols-[140px_1fr_1fr] gap-2 px-2 pt-3 text-[10px] uppercase tracking-wide text-[var(--fg-muted)]">
            <span>Conditions</span>
            <span>v{fromV}</span>
            <span>v{toV}</span>
          </div>
          {conditionRows.length === 0 && (
            <p className="px-2 text-xs text-[var(--fg-muted)]">No conditions.</p>
          )}
          {conditionRows.map((r, i) => {
            const changed = r.from !== r.to;
            return (
              <div
                key={i}
                className={cn(
                  "grid grid-cols-[140px_1fr_1fr] items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                  changed ? "bg-amber-400/5" : ""
                )}
              >
                <span className="text-[var(--fg-muted)]">#{i + 1}</span>
                <span className={cn("truncate font-mono", changed && "text-red-300")}>{r.from}</span>
                <span className={cn("truncate font-mono", changed && "text-[var(--accent)]")}>{r.to}</span>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
