"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, ChevronDown, Check, Copy } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PseudocodePreviewDialog } from "@/components/definitions/PseudocodePreviewDialog";
import { useWorkspaceStore } from "@/stores/workspace";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FORMATS = [
  { id: "generic", label: "Generic", ext: "txt" },
  { id: "sql", label: "SQL", ext: "sql" },
  { id: "python", label: "Python", ext: "py" },
  { id: "dbt", label: "dbt", ext: "sql" },
] as const;

type FormatId = (typeof FORMATS)[number]["id"];

type DefinitionRow = { id: string; name: string; type: string; slug: string };

export default function PseudocodesPage() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [previewDef, setPreviewDef] = useState<DefinitionRow | null>(null);

  const { data: definitions = [], isLoading } = useQuery({
    queryKey: ["definitions", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/definitions?workspaceId=${workspaceId}`);
      const json = await res.json();
      return (json.data ?? []) as DefinitionRow[];
    },
    enabled: !!workspaceId,
  });

  const toggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === definitions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(definitions.map((d) => d.id)));
    }
  };

  const exportAs = async (format: FormatId) => {
    if (selected.size === 0) {
      toast.error("Select at least one definition");
      return;
    }
    const fmt = FORMATS.find((f) => f.id === format)!;
    setExporting(true);
    try {
      const lines: string[] = [];
      for (const id of selected) {
        const def = definitions.find((d) => d.id === id);
        if (!def) continue;
        const res = await fetch(`/api/definitions/${id}/pseudocode?format=${format}`);
        const json = await res.json();
        if (json.data?.code) {
          lines.push(`// ${def.name}\n${json.data.code}\n`);
        }
      }
      const blob = new Blob([lines.join("\n---\n\n")], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logicgate-${format}.${fmt.ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${fmt.label}`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#0d0f14]">
      <Topbar title="Pseudocodes">
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={exporting || selected.size === 0}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-[var(--accent)] px-3 text-sm font-medium text-black disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export as
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-white/10 bg-[#161920]">
            {FORMATS.map((f) => (
              <DropdownMenuItem key={f.id} onClick={() => exportAs(f.id)}>
                {f.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </Topbar>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-white/50">
            Click a definition to preview pseudocode. Use checkboxes to select items for export.
          </p>
          <Button variant="outline" size="sm" className="border-white/10" onClick={toggleAll}>
            {selected.size === definitions.length && definitions.length > 0
              ? "Deselect all"
              : "Select all"}
          </Button>
        </div>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#161920] p-4">
                <Skeleton className="h-4 w-4" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && definitions.length === 0 && (
          <div className="lg-fade-up flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--accent)]/15 bg-[var(--accent)]/5">
              <Download className="h-7 w-7 text-[var(--accent)]/70" />
            </div>
            <h3 className="font-[family-name:var(--app-font)] text-lg font-semibold">
              Nothing to export yet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-white/50">
              Create definitions first — their compiled pseudocode will be available to preview and export here.
            </p>
          </div>
        )}
        <div className="lg-stagger grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {definitions.map((d) => (
            <PseudocodeCard
              key={d.id}
              d={d}
              selected={selected.has(d.id)}
              onToggle={(e) => toggleCheck(d.id, e)}
              onOpen={() => setPreviewDef(d)}
            />
          ))}
        </div>
      </div>

      <PseudocodePreviewDialog
        definition={previewDef}
        open={!!previewDef}
        onOpenChange={(o) => !o && setPreviewDef(null)}
      />
    </div>
  );
}

function PseudocodeCard({
  d,
  selected,
  onToggle,
  onOpen,
}: {
  d: DefinitionRow;
  selected: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onOpen: () => void;
}) {
  const [fmt, setFmt] = useState<FormatId>("generic");
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCopying(true);
    try {
      const res = await fetch(`/api/definitions/${d.id}/pseudocode?format=${fmt}`);
      const json = await res.json();
      if (json.data?.code) {
        await navigator.clipboard.writeText(json.data.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        toast.success(`Copied ${FORMATS.find((f) => f.id === fmt)?.label} pseudocode`);
      } else {
        toast.error("Nothing to copy yet");
      }
    } catch {
      toast.error("Copy failed");
    } finally {
      setCopying(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={cn(
        "group flex cursor-pointer flex-col rounded-xl border p-4 transition-colors",
        selected
          ? "border-[#4ade80]/40 bg-[#4ade80]/[0.06]"
          : "border-white/10 bg-[#161920] hover:border-white/20 hover:bg-[#1a1e29]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-md bg-white/5 px-2 py-0.5 font-[family-name:var(--font-mono,ui-monospace)] text-[10px] uppercase tracking-wider text-white/45">
          {d.type}
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-label={`Select ${d.name} for export`}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
            selected
              ? "border-[var(--accent)] bg-[var(--accent)] text-black"
              : "border-white/20 text-transparent hover:border-white/40"
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="mt-4 truncate font-medium text-white">{d.name}</p>

      {/* Per-card language toggle + quick copy — no dialog needed. */}
      <div
        className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-0.5">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFmt(f.id)}
              className={cn(
                "rounded px-1.5 py-0.5 font-[family-name:var(--font-mono,ui-monospace)] text-[10px] transition-colors",
                fmt === f.id
                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copy}
          disabled={copying}
          aria-label="Copy pseudocode"
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-white/45 transition-colors hover:text-white disabled:opacity-50"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[var(--accent)]" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
