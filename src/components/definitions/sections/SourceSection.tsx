"use client";

import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard, FieldRow } from "@/components/definitions/sections/SectionShell";
import { SectionInfoTip } from "@/components/definitions/sections/SectionInfoTip";
import type { JoinClause } from "@/lib/compiler";

export type SourceFields = {
  sourceTable: string | null;
  sourceValueField: string | null;
  sourceDateField: string | null;
  currency: string | null;
  joins: JoinClause[];
};

const JOIN_TYPES = ["INNER", "LEFT", "RIGHT"] as const;

type SourceSectionProps = {
  values: SourceFields;
  sourceTables?: { name: string; columns: string[] }[];
  onChange: (patch: Partial<SourceFields>) => void;
};

const triggerClass = "h-9 w-full bg-[var(--background,#0d0f14)]";
const contentClass =
  "z-[200] max-h-60 w-[var(--anchor-width)] border border-white/10 bg-[#161920] text-white shadow-xl";

export function SourceSection({ values, sourceTables = [], onChange }: SourceSectionProps) {
  const table = sourceTables.find((t) => t.name === values.sourceTable);
  const columns = table?.columns ?? [];
  const joins = values.joins ?? [];

  const setJoins = (next: JoinClause[]) => onChange({ joins: next });
  const addJoin = () => setJoins([...joins, { table: "", type: "INNER", on: "" }]);
  const updateJoin = (i: number, patch: Partial<JoinClause>) =>
    setJoins(joins.map((j, idx) => (idx === i ? { ...j, ...patch } : j)));
  const removeJoin = (i: number) => setJoins(joins.filter((_, idx) => idx !== i));

  return (
    <SectionCard
      iconClassName="bg-[var(--blue-dim)]"
      title="Source Fields"
      titleInfo={
        <SectionInfoTip
          description="Where the data lives: table, columns for values and dates, and currency if amounts need conversion."
          example="Table transactions, value field amount_usd, date field transaction_date, currency USD."
        />
      }
    >
      <div className="divide-y divide-white/5">
        <FieldRow label="Source table">
          {/* Combo: pick an existing table from the list, or type a brand-new
              name. Defined tables come from Configuration → Data sources. */}
          <Input
            list="lg-source-tables"
            placeholder={
              sourceTables.length > 0 ? "Select or type a table…" : "e.g. transactions"
            }
            value={values.sourceTable ?? ""}
            onChange={(e) => {
              const v = e.target.value || null;
              const pickedKnownTable =
                !!v && v !== values.sourceTable && sourceTables.some((t) => t.name === v);
              onChange(
                pickedKnownTable
                  ? { sourceTable: v, sourceValueField: null, sourceDateField: null }
                  : { sourceTable: v }
              );
            }}
            className="h-9 bg-[var(--background,#0d0f14)]"
          />
          <datalist id="lg-source-tables">
            {sourceTables.map((t) => (
              <option key={t.name} value={t.name} />
            ))}
          </datalist>
        </FieldRow>

        <FieldRow label="Value field">
          {columns.length > 0 ? (
            <Select
              value={values.sourceValueField ?? ""}
              onValueChange={(v) => onChange({ sourceValueField: v || null })}
            >
              <SelectTrigger className={triggerClass}>
                <SelectValue placeholder="Column" />
              </SelectTrigger>
              <SelectContent className={contentClass}>
                {columns.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="amount_usd"
              value={values.sourceValueField ?? ""}
              onChange={(e) => onChange({ sourceValueField: e.target.value || null })}
              className="h-9 bg-[var(--background,#0d0f14)]"
            />
          )}
        </FieldRow>

        <FieldRow label="Date field">
          {columns.length > 0 ? (
            <Select
              value={values.sourceDateField ?? ""}
              onValueChange={(v) => onChange({ sourceDateField: v || null })}
            >
              <SelectTrigger className={triggerClass}>
                <SelectValue placeholder="Column" />
              </SelectTrigger>
              <SelectContent className={contentClass}>
                {columns.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="transaction_date"
              value={values.sourceDateField ?? ""}
              onChange={(e) => onChange({ sourceDateField: e.target.value || null })}
              className="h-9 bg-[var(--background,#0d0f14)]"
            />
          )}
        </FieldRow>

        <FieldRow label="Currency">
          <Input
            placeholder="USD (converted)"
            value={values.currency ?? ""}
            onChange={(e) => onChange({ currency: e.target.value || null })}
            className="h-9 bg-[var(--background,#0d0f14)]"
          />
        </FieldRow>

        <div className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <label className="text-[13px] text-[var(--fg-muted)]">Joins</label>
              <SectionInfoTip
                description="Combine multiple tables. Each join specifies the table, join type, and the ON condition. Compiles to SQL / dbt JOIN clauses."
                example="LEFT JOIN users ON customizedplanrate.user_id = users.id"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 border-white/10 text-xs"
              onClick={addJoin}
            >
              <Plus className="h-3.5 w-3.5" /> Add join
            </Button>
          </div>

          {joins.length === 0 ? (
            <p className="mt-2 text-[11px] text-[var(--fg-muted)]/70">
              No joins — this definition reads a single table.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {joins.map((j, i) => (
                <div key={i} className="flex flex-wrap items-center gap-1.5">
                  <Select
                    value={j.type || "INNER"}
                    onValueChange={(v) => v && updateJoin(i, { type: v })}
                  >
                    <SelectTrigger className="h-8 w-[86px] shrink-0 bg-[var(--background,#0d0f14)] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={contentClass}>
                      {JOIN_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    list="lg-source-tables"
                    placeholder="table"
                    value={j.table}
                    onChange={(e) => updateJoin(i, { table: e.target.value })}
                    className="h-8 w-[130px] shrink-0 bg-[var(--background,#0d0f14)] font-mono text-xs"
                  />
                  <span className="text-[10px] text-[var(--fg-muted)]">ON</span>
                  <Input
                    placeholder="a.id = b.id"
                    value={j.on}
                    onChange={(e) => updateJoin(i, { on: e.target.value })}
                    className="h-8 min-w-[120px] flex-1 bg-[var(--background,#0d0f14)] font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeJoin(i)}
                    className="text-[var(--fg-muted)] hover:text-red-400"
                    title="Remove join"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
