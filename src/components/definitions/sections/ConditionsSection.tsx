"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard } from "@/components/definitions/sections/SectionShell";
import { SectionInfoTip } from "@/components/definitions/sections/SectionInfoTip";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";

export type ConditionRow = {
  id?: string;
  order: number;
  connector: string;
  field: string;
  operator: string;
  value: string | null;
  valueType: string;
};

const CONNECTORS = ["IF", "AND", "OR"] as const;
const OPERATORS = [
  "EQUALS",
  "NOT_EQUALS",
  "IN",
  "NOT_IN",
  "GREATER_THAN",
  "LESS_THAN",
  "GREATER_EQUAL",
  "LESS_EQUAL",
  "IS_NULL",
  "IS_NOT_NULL",
  "CONTAINS",
  "STARTS_WITH",
] as const;

const OPERATOR_LABELS: Record<string, string> = {
  EQUALS: "is",
  NOT_EQUALS: "is not",
  IN: "in",
  NOT_IN: "not in",
  GREATER_THAN: ">",
  LESS_THAN: "<",
  GREATER_EQUAL: "≥",
  LESS_EQUAL: "≤",
  IS_NULL: "is null",
  IS_NOT_NULL: "is not null",
  CONTAINS: "contains",
  STARTS_WITH: "starts with",
};

// Connector colors from the design mockup: IF blue, AND purple, OR amber.
const connectorColor: Record<string, string> = {
  IF: "bg-[var(--blue-dim)] text-[var(--blue)]",
  AND: "bg-[var(--purple-dim)] text-[var(--purple)]",
  OR: "bg-[var(--amber-dim)] text-[var(--amber)]",
};

const contentClass =
  "z-[200] max-h-60 border border-white/10 bg-[#161920] text-white shadow-xl";

type ConditionsSectionProps = {
  conditions: ConditionRow[];
  onChange: (conditions: ConditionRow[]) => void;
  debounceMs?: number;
};

function SortableRow({
  row,
  index,
  onUpdate,
  onDelete,
}: {
  row: ConditionRow;
  index: number;
  onUpdate: (patch: Partial<ConditionRow>) => void;
  onDelete: () => void;
}) {
  const id = row.id ?? `temp-${index}`;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const hasValue = !["IS_NULL", "IS_NOT_NULL"].includes(row.operator);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-[var(--surface2)] px-2 py-2 transition-colors duration-150 hover:border-white/20",
        isDragging && "border-[var(--accent,#4ade80)]/40 opacity-70 shadow-lg shadow-black/30"
      )}
    >
      <button
        type="button"
        className="cursor-grab text-white/20 opacity-0 transition-opacity group-hover:opacity-100"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <Select value={row.connector} onValueChange={(v) => v && onUpdate({ connector: v })}>
        <SelectTrigger
          className={cn(
            "h-7 w-16 justify-center rounded-md border-0 px-2 text-[11px] font-semibold",
            connectorColor[row.connector] ?? connectorColor.AND
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className={contentClass}>
          {CONNECTORS.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="field"
        value={row.field}
        onChange={(e) => onUpdate({ field: e.target.value })}
        className="h-7 min-w-[110px] flex-1 rounded-md bg-[var(--blue-dim)] text-[11px] text-[var(--blue)] placeholder:text-[var(--blue)]/40"
      />

      <Select value={row.operator} onValueChange={(v) => v && onUpdate({ operator: v })}>
        <SelectTrigger className="h-7 w-28 rounded-md bg-white/5 text-xs text-white/60">
          <SelectValue>{OPERATOR_LABELS[row.operator] ?? row.operator}</SelectValue>
        </SelectTrigger>
        <SelectContent className={contentClass}>
          {OPERATORS.map((op) => (
            <SelectItem key={op} value={op}>
              {OPERATOR_LABELS[op] ?? op}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasValue && (
        <Input
          placeholder="value"
          value={row.value ?? ""}
          onChange={(e) => onUpdate({ value: e.target.value || null })}
          className="h-7 min-w-[90px] flex-1 rounded-md bg-[var(--amber-dim)] text-[11px] text-[var(--amber)] placeholder:text-[var(--amber)]/40"
        />
      )}

      <button
        type="button"
        onClick={onDelete}
        className="ml-auto rounded p-1 text-white/20 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ConditionsSection({ conditions, onChange, debounceMs = 800 }: ConditionsSectionProps) {
  const [local, setLocal] = useState(conditions);
  const debounced = useDebouncedValue(local, debounceMs);

  useEffect(() => {
    setLocal(conditions);
  }, [conditions]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current(debounced.map((c, i) => ({ ...c, order: i })));
  }, [debounced]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLocal((items) => {
      const ids = items.map((c, i) => c.id ?? `temp-${i}`);
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      return arrayMove(items, oldIndex, newIndex).map((c, i) => ({ ...c, order: i }));
    });
  }, []);

  const addRow = () => {
    setLocal((prev) => [
      ...prev,
      {
        order: prev.length,
        connector: prev.length === 0 ? "IF" : "AND",
        field: "",
        operator: "EQUALS",
        value: null,
        valueType: "STRING",
      },
    ]);
  };

  const updateRow = (index: number, patch: Partial<ConditionRow>) => {
    setLocal((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const deleteRow = (index: number) => {
    setLocal((prev) => prev.filter((_, i) => i !== index));
  };

  const sortIds = local.map((c, i) => c.id ?? `temp-${i}`);

  return (
    <SectionCard
      iconClassName="bg-[var(--amber-dim)]"
      title="Filter Logic"
      titleInfo={
        <SectionInfoTip
          description="Rules that narrow rows before aggregation or output. Combine conditions with AND / OR."
          example="status is completed AND type not in refund, chargeback."
        />
      }
    >
      <div className="space-y-2">
        {local.length === 0 && (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-center text-[11px] text-white/35">
            No filters yet — every row is included. Add a condition to narrow the result.
          </p>
        )}
        {local.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortIds} strategy={verticalListSortingStrategy}>
              {local.map((row, index) => (
                <SortableRow
                  key={sortIds[index]}
                  row={row}
                  index={index}
                  onUpdate={(patch) => updateRow(index, patch)}
                  onDelete={() => deleteRow(index)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
        <button
          type="button"
          onClick={addRow}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--border2)] px-3 py-2 text-[11px] text-white/40 transition-colors hover:border-[var(--accent,#4ade80)] hover:bg-[var(--accent-dim2)] hover:text-[var(--accent,#4ade80)]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add condition
        </button>
      </div>
    </SectionCard>
  );
}
