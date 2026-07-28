"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check } from "lucide-react";
import { SourceSection, type SourceFields } from "@/components/definitions/sections/SourceSection";
import { ConditionsSection, type ConditionRow } from "@/components/definitions/sections/ConditionsSection";
import { AggregationSection, type AggregationFields } from "@/components/definitions/sections/AggregationSection";
import { OwnershipSection } from "@/components/definitions/sections/OwnershipSection";
import { DocumentationSection } from "@/components/definitions/sections/DocumentationSection";
import { AiDefinitionPrompt, type AiParseResult } from "@/components/definitions/AiDefinitionPrompt";
import { summarizeDefinition } from "@/lib/ai/assist";
import type { JoinClause } from "@/lib/compiler";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { WorkspaceSettings } from "@/types";

type OwnerRef = { userId: string; isPrimary?: boolean; user?: { id: string; name: string; email: string; avatarInitials?: string } };

type DefinitionData = {
  id: string;
  name?: string | null;
  type?: string | null;
  documentation?: string | null;
  sourceTable: string | null;
  sourceValueField: string | null;
  sourceDateField: string | null;
  currency: string | null;
  joins?: JoinClause[] | null;
  aggregationFn: string | null;
  groupByPeriod: string | null;
  dedupeBy: string | null;
  dedupeStrategy: string | null;
  ownerId: string | null;
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
    joins: definition.joins ?? [],
  });
  const [aggregation, setAggregation] = useState<AggregationFields>({
    aggregationFn: definition.aggregationFn,
    groupByPeriod: definition.groupByPeriod,
    dedupeBy: definition.dedupeBy,
    dedupeStrategy: definition.dedupeStrategy,
  });
  const [conditions, setConditions] = useState<ConditionRow[]>(definition.conditions);
  const [documentation, setDocumentation] = useState(definition.documentation ?? "");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Baselines of what is already persisted. Saves only fire on real diffs.
  const savedFieldsRef = useRef<string>(stable({ ...source, ...aggregation }));
  const savedDocumentationRef = useRef<string>(documentation.trim());
  const savedConditionsRef = useRef<string>(stableConditions(definition.conditions));

  // Live comparison against the last-submitted state → shows "Unsaved changes"
  // between an edit and the debounced autosave firing.
  const dirty =
    stable({ ...source, ...aggregation }) !== savedFieldsRef.current ||
    documentation.trim() !== savedDocumentationRef.current ||
    stableConditions(conditions.filter((c) => c.field && c.field.trim())) !==
      savedConditionsRef.current;

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const patchPayload = useDebouncedValue({ ...source, ...aggregation }, 1200);
  const debouncedDocumentation = useDebouncedValue(documentation, 1200);
  const debouncedConditions = useDebouncedValue(conditions, 800);

  useEffect(() => {
    const doc = definition.documentation ?? "";
    setDocumentation(doc);
    savedDocumentationRef.current = doc.trim();
  }, [definition.id, definition.documentation]);

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
      flashSaved();
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
      flashSaved();
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

  const buildDocContext = useCallback(
    () =>
      summarizeDefinition(
        {
          name: definition.name,
          type: definition.type,
          sourceTable: source.sourceTable,
          sourceValueField: source.sourceValueField,
          sourceDateField: source.sourceDateField,
          currency: source.currency,
          aggregationFn: aggregation.aggregationFn,
          groupByPeriod: aggregation.groupByPeriod,
          dedupeBy: aggregation.dedupeBy,
          dedupeStrategy: aggregation.dedupeStrategy,
        },
        conditions.map((c) => ({
          connector: c.connector,
          field: c.field,
          operator: c.operator,
          value: c.value,
        }))
      ),
    [source, aggregation, conditions, definition.name, definition.type]
  );

  const applyAiResult = useCallback((r: AiParseResult) => {
    if (r.source) {
      setSource((s) => ({
        ...s,
        sourceTable: r.source?.table ?? s.sourceTable,
        sourceValueField: r.source?.valueField ?? s.sourceValueField,
        sourceDateField: r.source?.dateField ?? s.sourceDateField,
      }));
    }
    if (r.aggregation) {
      setAggregation((a) => ({
        ...a,
        aggregationFn: r.aggregation?.fn ?? a.aggregationFn,
        groupByPeriod: r.aggregation?.groupByPeriod ?? a.groupByPeriod,
      }));
    }
    if (r.conditions?.length) {
      setConditions(
        r.conditions.map((c, i) => ({
          connector: c.connector,
          field: c.field,
          operator: c.operator,
          value: c.value,
          valueType: c.valueType,
          order: i,
        }))
      );
    }
  }, []);

  return (
    <div className="px-6 pb-8 pt-4">
      {/* Save status sits in flow above the cards — absolute placement used to
          overlap the first section's top edge. Fixed height keeps it steady. */}
      <div className="mb-2 flex h-6 items-center justify-end">
        {saving ? (
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-2.5 py-1 text-xs text-[var(--accent)]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving…
          </span>
        ) : dirty ? (
          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-[var(--fg-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Unsaved changes
          </span>
        ) : savedFlash ? (
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-2.5 py-1 text-xs text-[var(--accent)]">
            <Check className="h-3 w-3" />
            Saved
          </span>
        ) : null}
      </div>
      <div className="space-y-5">
        <AiDefinitionPrompt onApply={applyAiResult} onGeneratingChange={setAiGenerating} />

        <div className="relative" aria-busy={aiGenerating}>
          {aiGenerating && (
            <div className="absolute inset-0 z-20 flex items-start justify-center rounded-xl bg-[var(--background,#0d0f14)]/40 pt-24 backdrop-blur-[2px]">
              <div className="flex items-center gap-2.5 rounded-full border border-[var(--accent)]/25 bg-[var(--surface,#161920)] px-4 py-2 text-sm text-[var(--accent)] shadow-xl">
                <Loader2 className="h-4 w-4 animate-spin" />
                Building your definition…
              </div>
            </div>
          )}
          <div
            className={cn(
              "lg-stagger space-y-5 transition-opacity duration-300",
              aiGenerating && "pointer-events-none select-none opacity-50"
            )}
          >
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
              defaultCollapsed
            />
            <DocumentationSection
              value={documentation}
              onChange={setDocumentation}
              buildContext={buildDocContext}
              defaultCollapsed
            />
          </div>
        </div>
      </div>
    </div>
  );
}
