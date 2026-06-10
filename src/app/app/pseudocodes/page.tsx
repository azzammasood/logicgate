"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, ChevronDown } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { PageLoader } from "@/components/layout/PageLoader";
import { Button } from "@/components/ui/button";
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
            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-[#4ade80] px-3 text-sm font-medium text-black disabled:opacity-50"
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
      <PageLoader active={isLoading} message="Loading pseudocodes…" />
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
        <div className="space-y-2">
          {definitions.map((d) => (
            <div
              key={d.id}
              role="button"
              tabIndex={0}
              onClick={() => setPreviewDef(d)}
              onKeyDown={(e) => e.key === "Enter" && setPreviewDef(d)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                selected.has(d.id)
                  ? "border-[#4ade80]/40 bg-[#4ade80]/5"
                  : "border-white/10 bg-[#161920] hover:border-white/20"
              )}
            >
              <input
                type="checkbox"
                checked={selected.has(d.id)}
                onClick={(e) => toggleCheck(d.id, e)}
                onChange={() => {}}
                className="h-4 w-4 shrink-0 accent-[#4ade80]"
                aria-label={`Select ${d.name}`}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{d.name}</p>
                <p className="text-xs text-white/40">{d.type}</p>
              </div>
            </div>
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
