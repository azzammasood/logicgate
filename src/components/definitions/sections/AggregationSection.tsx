"use client";

import { Sigma } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard, FieldRow } from "@/components/definitions/sections/SectionShell";

export type AggregationFields = {
  aggregationFn: string | null;
  groupByPeriod: string | null;
  dedupeBy: string | null;
  dedupeStrategy: string | null;
};

type AggregationSectionProps = {
  values: AggregationFields;
  onChange: (patch: Partial<AggregationFields>) => void;
};

const AGG_FNS = ["SUM", "COUNT", "AVERAGE", "DISTINCT_COUNT", "MIN", "MAX"] as const;
const PERIODS = ["CALENDAR_MONTH", "FISCAL_MONTH", "WEEK", "DAY", "QUARTER", "YEAR"] as const;
const DEDUPE = ["KEEP_FIRST", "KEEP_LAST", "KEEP_MAX"] as const;

const triggerClass = "h-9 w-full bg-[var(--background,#0d0f14)]";
const contentClass =
  "z-[200] max-h-60 w-[var(--anchor-width)] border border-white/10 bg-[#161920] text-white shadow-xl";

const titleCase = (s: string) =>
  s.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function AggregationSection({ values, onChange }: AggregationSectionProps) {
  return (
    <SectionCard
      icon={Sigma}
      iconClassName="bg-purple-500/15 text-purple-400"
      title="Aggregation"
      rightLabel="How to compute"
    >
      <div className="divide-y divide-white/5">
        <FieldRow label="Function">
          <Select
            value={values.aggregationFn ?? ""}
            onValueChange={(v) => onChange({ aggregationFn: v || null })}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Select function" />
            </SelectTrigger>
            <SelectContent className={contentClass}>
              {AGG_FNS.map((fn) => (
                <SelectItem key={fn} value={fn}>
                  {fn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>

        <FieldRow label="Group by">
          <Select
            value={values.groupByPeriod ?? ""}
            onValueChange={(v) => onChange({ groupByPeriod: v || null })}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Period">
                {values.groupByPeriod ? titleCase(values.groupByPeriod) : "Period"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className={contentClass}>
              {PERIODS.map((p) => (
                <SelectItem key={p} value={p}>
                  {titleCase(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>

        <FieldRow label="Dedupe by">
          <div className="flex items-center gap-2">
            <Input
              placeholder="user_id"
              value={values.dedupeBy ?? ""}
              onChange={(e) => onChange({ dedupeBy: e.target.value || null })}
              className="h-9 w-32 shrink-0 bg-[var(--background,#0d0f14)]"
            />
            <Select
              value={values.dedupeStrategy ?? ""}
              onValueChange={(v) => onChange({ dedupeStrategy: v || null })}
            >
              <SelectTrigger className="h-9 flex-1 bg-[var(--background,#0d0f14)]">
                <SelectValue placeholder="Select Strategy">
                  {values.dedupeStrategy ? titleCase(values.dedupeStrategy) : "Select Strategy"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className={contentClass}>
                {DEDUPE.map((s) => (
                  <SelectItem key={s} value={s}>
                    {titleCase(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FieldRow>
      </div>
    </SectionCard>
  );
}
