"use client";

import { useState } from "react";
import { Plus, X, Table2, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export type SourceTable = { name: string; description?: string; columns: string[] };

type Props = {
  value: SourceTable[];
  onChange: (next: SourceTable[]) => void;
};

/**
 * Friendly editor for the workspace's source tables — no JSON. Stakeholders add
 * a table, then add the columns they're allowed to build definitions from.
 */
export function SourceTablesEditor({ value, onChange }: Props) {
  const [newTable, setNewTable] = useState("");
  const [colDrafts, setColDrafts] = useState<Record<number, string>>({});

  const addTable = () => {
    const name = newTable.trim();
    if (!name) return;
    if (value.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      setNewTable("");
      return;
    }
    onChange([...value, { name, columns: [] }]);
    setNewTable("");
  };

  const removeTable = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const renameTable = (i: number, name: string) =>
    onChange(value.map((t, idx) => (idx === i ? { ...t, name } : t)));

  const describeTable = (i: number, description: string) =>
    onChange(value.map((t, idx) => (idx === i ? { ...t, description } : t)));

  const addColumn = (i: number) => {
    const col = (colDrafts[i] ?? "").trim();
    if (!col) return;
    onChange(
      value.map((t, idx) =>
        idx === i && !t.columns.includes(col)
          ? { ...t, columns: [...t.columns, col] }
          : t
      )
    );
    setColDrafts((d) => ({ ...d, [i]: "" }));
  };

  const removeColumn = (i: number, col: string) =>
    onChange(
      value.map((t, idx) =>
        idx === i ? { ...t, columns: t.columns.filter((c) => c !== col) } : t
      )
    );

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-[#161920] p-4">
        <Database className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
        <p className="text-xs leading-relaxed text-white/50">
          Document the tables and columns your team builds metrics from. Add a short
          description so everyone knows what each table holds. These also power the
          dropdowns in the definition builder — no code required.
        </p>
      </div>

      {value.map((table, i) => (
        <div
          key={i}
          className="space-y-3 rounded-lg border border-white/10 bg-[#161920] p-4"
        >
          <div className="flex items-center gap-2">
            <Table2 className="h-4 w-4 shrink-0 text-white/40" />
            <Input
              value={table.name}
              onChange={(e) => renameTable(i, e.target.value)}
              placeholder="table_name"
              className="h-8 flex-1 bg-[#0d0f14] font-mono text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-white/40 hover:text-red-400"
              onClick={() => removeTable(i)}
              title="Remove table"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="pl-6">
            <Textarea
              value={table.description ?? ""}
              onChange={(e) => describeTable(i, e.target.value)}
              placeholder="What does this table hold? (documentation for your team)"
              className="min-h-[56px] resize-y bg-[#0d0f14] text-xs"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2 pl-6">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
              Columns
            </span>
            <span className="text-[10px] text-white/25">{table.columns.length}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pl-6">
            {table.columns.map((col) => (
              <span
                key={col}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#0d0f14] px-2 py-1 font-mono text-xs text-white/70"
              >
                {col}
                <button
                  type="button"
                  onClick={() => removeColumn(i, col)}
                  className="text-white/30 hover:text-red-400"
                  title="Remove column"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {table.columns.length === 0 && (
              <span className="text-[11px] text-white/30">No columns yet.</span>
            )}
          </div>

          <div className="flex items-center gap-2 pl-6">
            <Input
              value={colDrafts[i] ?? ""}
              onChange={(e) => setColDrafts((d) => ({ ...d, [i]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addColumn(i);
                }
              }}
              placeholder="add a column…"
              className="h-8 max-w-[200px] bg-[#0d0f14] font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 border-white/10"
              onClick={() => addColumn(i)}
            >
              <Plus className="h-3.5 w-3.5" /> Add column
            </Button>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <Input
          value={newTable}
          onChange={(e) => setNewTable(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTable();
            }
          }}
          placeholder="New table name…"
          className="h-9 max-w-xs bg-[#161920] font-mono text-sm"
        />
        <Button
          type="button"
          variant="outline"
          className="gap-1.5 border-white/10"
          onClick={addTable}
        >
          <Plus className="h-4 w-4" /> Add table
        </Button>
      </div>
    </div>
  );
}
