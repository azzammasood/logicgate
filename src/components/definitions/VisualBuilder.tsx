"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { SourceSection, type SourceFields } from "@/components/definitions/sections/SourceSection";
import { ConditionsSection, type ConditionRow } from "@/components/definitions/sections/ConditionsSection";
import { AggregationSection, type AggregationFields } from "@/components/definitions/sections/AggregationSection";
import { OwnershipSection } from "@/components/definitions/sections/OwnershipSection";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toast } from "sonner";
import type { WorkspaceSettings } from "@/types";

type OwnerRef = { userId: string; isPrimary?: boolean; user?: { id: string; name: string; email: string; avatarInitials?: string } };

type DefinitionData = {
  id: string;
  sourceTable: string | null;
  sourceValueField: string | null;
  sourceDateField: string | null;
  currency: string | null;
  aggregationFn: string | null;
  groupByPeriod: string | null;
  dedupeBy: string | null;
  dedupeStrategy: string | null;
  ownerId: string;
  approverId: string | null;
  owners?: OwnerRef[];
  conditions: ConditionRow[];
};

type VisualBuilderProps = {
  definition: DefinitionData;
  workspaceSettings?: WorkspaceSettings;
  members?: { id: string; name: string; email: string; avatarInitials?: string }[];
  onSaved?: () => void;
};

const stable = (obj: Record<string, unknown>) =>
  JSON.stringify(
    Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = obj[k] ?? null;
        return acc;
      }, {})
  );

const stableConditions = (rows: ConditionRow[]) =>
  JSON.stringify(
    rows.map((c, i) => ({
      order: i,
      connector: c.connector,
      field: c.field,
      operator: c.operator,
      value: c.value ?? null,
      valueType: c.valueType ?? "STRING",
    }))
  );

export function VisualBuilder({
  definition,
  workspaceSettings,
  members = [],
  onSaved,
}: VisualBuilderProps) {
  const qc = useQueryClient();
  const [source, setSource] = useState<SourceFields>({
    sourceTable: definition.sourceTable,
    sourceValueField: definition.sourceValueField,
    sourceDateField: definition.sourceDateField,
    currency: definition.currency,
  });
  const [aggregation, setAggregation] = useState<AggregationFields>({
    aggregationFn: definition.aggregationFn,
    groupByPeriod: definition.groupByPeriod,
    dedupeBy: definition.dedupeBy,
    dedupeStrategy: definition.dedupeStrategy,
  });
  const [conditions, setConditions] = useState<ConditionRow[]>(definition.conditions);
  const [saving, setSaving] = useState(false);

  // Baselines of what is already persisted. Saves only fire on real diffs.
  const savedFieldsRef = useRef<string>(stable({ ...source, ...aggregation }));
  const savedConditionsRef = useRef<string>(stableConditions(definition.conditions));

  const patchPayload = useDebouncedValue({ ...source, ...aggregation }, 1200);
  const debouncedConditions = useDebouncedValue(conditions, 800);

  const patchMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/definitions/${definition.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, changeDescription: "Visual builder update" }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onMutate: () => setSaving(true),
    onSettled: () => setSaving(false),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["definition", definition.id] });
      qc.invalidateQueries({ queryKey: ["versions", definition.id] });
      qc.invalidateQueries({ queryKey: ["definition-versions", definition.id] });
      qc.invalidateQueries({ queryKey: ["pseudocode", definition.id] });
      onSaved?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const conditionsMutation = useMutation({
    mutationFn: async (rows: ConditionRow[]) => {
      const res = await fetch(`/api/definitions/${definition.id}/conditions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conditions: rows.map((c, i) => ({
            connector: c.connector,
            field: c.field,
            operator: c.operator,
            value: c.value,
            valueType: c.valueType ?? "STRING",
            order: i,
          })),
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onMutate: () => setSaving(true),
    onSettled: () => setSaving(false),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["definition", definition.id] });
      qc.invalidateQueries({ queryKey: ["versions", definition.id] });
      qc.invalidateQueries({ queryKey: ["pseudocode", definition.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    const next = stable(patchPayload);
    if (next === savedFieldsRef.current) return; // nothing actually changed
    savedFieldsRef.current = next;
    patchMutation.mutate(patchPayload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patchPayload]);

  useEffect(() => {
    // Only persist complete rows (a field selected); skip half-typed rows.
    const complete = debouncedConditions.filter((c) => c.field && c.field.trim());
    const next = stableConditions(complete);
    if (next === savedConditionsRef.current) return;
    savedConditionsRef.current = next;
    conditionsMutation.mutate(complete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedConditions]);

  const handleConditionsChange = useCallback((rows: ConditionRow[]) => {
    setConditions(rows);
  }, []);

  return (
    <div className="relative space-y-5 px-6 pb-8 pt-4">
      {saving && (
        <div className="absolute right-6 top-0 flex items-center gap-2 text-xs text-[var(--accent)]">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </div>
      )}
      <SourceSection
        values={source}
        sourceTables={workspaceSettings?.sourceTables}
        onChange={(patch) => setSource((s) => ({ ...s, ...patch }))}
      />
      <ConditionsSection conditions={conditions} onChange={handleConditionsChange} />
      <AggregationSection
        values={aggregation}
        onChange={(patch) => setAggregation((a) => ({ ...a, ...patch }))}
      />
      <OwnershipSection
        definitionId={definition.id}
        approverId={definition.approverId}
        owners={(definition.owners ?? []).map((o) => ({
          id: o.user?.id ?? o.userId,
          name: o.user?.name ?? "",
        }))}
        members={members}
        onSaved={onSaved}
      />
    </div>
  );
}
