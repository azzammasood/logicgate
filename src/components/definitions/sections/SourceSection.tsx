"use client";

import { Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard, FieldRow } from "@/components/definitions/sections/SectionShell";
import { SectionInfoTip } from "@/components/definitions/sections/SectionInfoTip";

export type SourceFields = {
  sourceTable: string | null;
  sourceValueField: string | null;
  sourceDateField: string | null;
  currency: string | null;
};

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

  return (
    <SectionCard
      icon={Database}
      iconClassName="bg-blue-500/15 text-blue-400"
      title="Source Fields"
      titleInfo={
        <SectionInfoTip
          description="Where the data lives: table, columns for values and dates, and currency if amounts need conversion."
          example="Table transactions, value field amount_usd, date field transaction_date, currency USD."
        />
      }
      rightLabel={values.sourceTable ? `${values.sourceTable} table` : "no table"}
    >
      <div className="divide-y divide-white/5">
        <FieldRow label="Source table">
          {sourceTables.length > 0 ? (
            <Select
              value={values.sourceTable ?? ""}
              onValueChange={(v) =>
                onChange({ sourceTable: v || null, sourceValueField: null, sourceDateField: null })
              }
            >
              <SelectTrigger className={triggerClass}>
                <SelectValue placeholder="Select table" />
              </SelectTrigger>
              <SelectContent className={contentClass}>
                {sourceTables.map((t) => (
                  <SelectItem key={t.name} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="e.g. transactions"
              value={values.sourceTable ?? ""}
              onChange={(e) => onChange({ sourceTable: e.target.value || null })}
              className="h-9 bg-[var(--background,#0d0f14)]"
            />
          )}
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
      </div>
    </SectionCard>
  );
}
