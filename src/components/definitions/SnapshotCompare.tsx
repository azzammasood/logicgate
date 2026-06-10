"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export type Snapshot = {
  definition?: Record<string, unknown>;
  conditions?: {
    field: string;
    operator: string;
    value: string | null;
    connector: string;
    order?: number;
  }[];
};

const FIELDS: { key: string; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  { key: "documentation", label: "Documentation" },
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

function val(s: Snapshot | null | undefined, key: string) {
  const v = s?.definition?.[key];
  return v === null || v === undefined || v === "" ? "—" : String(v);
}

function condText(c: {
  field: string;
  operator: string;
  value: string | null;
  connector: string;
}) {
  return `${c.connector} ${c.field} ${c.operator} ${c.value ?? ""}`.trim();
}

export function SnapshotCompare({
  fromLabel,
  toLabel,
  fromSnap,
  toSnap,
  onlyChanged = false,
}: {
  fromLabel: string;
  toLabel: string;
  fromSnap: Snapshot | null | undefined;
  toSnap: Snapshot | null | undefined;
  onlyChanged?: boolean;
}) {
  const rows = useMemo(
    () => FIELDS.map((f) => ({ ...f, before: val(fromSnap, f.key), after: val(toSnap, f.key) })),
    [fromSnap, toSnap]
  );

  const conditionRows = useMemo(() => {
    const a = (fromSnap?.conditions ?? [])
      .slice()
      .sort((x, y) => (x.order ?? 0) - (y.order ?? 0))
      .map(condText);
    const b = (toSnap?.conditions ?? [])
      .slice()
      .sort((x, y) => (x.order ?? 0) - (y.order ?? 0))
      .map(condText);
    const max = Math.max(a.length, b.length);
    return Array.from({ length: max }, (_, i) => ({ before: a[i] ?? "—", after: b[i] ?? "—" }));
  }, [fromSnap, toSnap]);

  const visibleFields = onlyChanged ? rows.filter((r) => r.before !== r.after) : rows;
  const visibleConditions = onlyChanged
    ? conditionRows.filter((r) => r.before !== r.after)
    : conditionRows;
  const showConditions = visibleConditions.length > 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-xs">
        <colgroup>
          <col className="w-[28%]" />
          <col className="w-[36%]" />
          <col className="w-[36%]" />
        </colgroup>
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-[var(--fg-muted)]">
            <th className="px-2 py-1.5 text-left font-medium">Field</th>
            <th className="px-2 py-1.5 text-left font-medium">{fromLabel}</th>
            <th className="px-2 py-1.5 text-left font-medium">{toLabel}</th>
          </tr>
        </thead>
        <tbody>
          {visibleFields.length === 0 && onlyChanged && (
            <tr>
              <td colSpan={3} className="px-2 py-2 text-[var(--fg-muted)]">
                No field changes.
              </td>
            </tr>
          )}
          {visibleFields.map((f) => {
            const changed = f.before !== f.after;
            return (
              <tr
                key={f.key}
                className={cn(changed && "bg-amber-400/5")}
              >
                <td className="px-2 py-1.5 align-top text-[var(--fg-muted)]">{f.label}</td>
                <td
                  className={cn(
                    "px-2 py-1.5 align-top break-words",
                    changed && "text-red-300 line-through"
                  )}
                >
                  {f.before}
                </td>
                <td
                  className={cn(
                    "px-2 py-1.5 align-top break-words",
                    changed && "text-[var(--accent)]"
                  )}
                >
                  {f.after}
                </td>
              </tr>
            );
          })}
          {showConditions &&
            visibleConditions.map((r, i) => {
              const changed = r.before !== r.after;
              return (
                <tr key={`cond-${i}`} className={cn(changed && "bg-amber-400/5")}>
                  <td className="px-2 py-1.5 align-top text-[var(--fg-muted)]">
                    {i === 0 ? "Condition" : `#${i + 1}`}
                  </td>
                  <td
                    className={cn(
                      "px-2 py-1.5 align-top break-words font-mono",
                      changed && "text-red-300"
                    )}
                  >
                    {r.before}
                  </td>
                  <td
                    className={cn(
                      "px-2 py-1.5 align-top break-words font-mono",
                      changed && "text-[var(--accent)]"
                    )}
                  >
                    {r.after}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
