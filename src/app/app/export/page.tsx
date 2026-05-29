"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import JSZip from "jszip";
import { Download } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/stores/workspace";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FORMATS = ["generic", "sql", "python", "dbt"] as const;

export default function ExportPage() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const { data: definitions = [], isLoading } = useQuery({
    queryKey: ["definitions", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/definitions?workspaceId=${workspaceId}`);
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!workspaceId,
  });

  const toggle = (id: string) => {
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
      setSelected(new Set(definitions.map((d: { id: string }) => d.id)));
    }
  };

  const exportZip = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one definition");
      return;
    }
    setExporting(true);
    try {
      const zip = new JSZip();
      for (const id of selected) {
        const def = definitions.find((d: { id: string }) => d.id === id);
        if (!def) continue;
        const folder = zip.folder(def.slug ?? def.name) ?? zip;
        for (const format of FORMATS) {
          const res = await fetch(`/api/definitions/${id}/pseudocode?format=${format}`);
          const json = await res.json();
          if (json.data?.code) {
            const ext =
              format === "sql" ? "sql" : format === "python" ? "py" : format === "dbt" ? "sql" : "txt";
            folder.file(`${format}.${ext}`, json.data.code);
          }
        }
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logicgate-pseudocodes-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#0d0f14]">
      <Topbar title="Pseudocode Export">
        <Button
          className="bg-[#4ade80] text-black"
          disabled={exporting || selected.size === 0}
          onClick={exportZip}
        >
          <Download className="mr-1 h-4 w-4" />
          Export {selected.size > 0 ? `(${selected.size})` : ""}
        </Button>
      </Topbar>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-white/50">
            Select definitions to export pseudocode (all formats) as ZIP.
          </p>
          <Button variant="outline" size="sm" className="border-white/10" onClick={toggleAll}>
            {selected.size === definitions.length ? "Deselect all" : "Select all"}
          </Button>
        </div>
        {isLoading && <p className="text-sm text-white/40">Loading…</p>}
        <div className="space-y-2">
          {definitions.map((d: { id: string; name: string; type: string; slug: string }) => (
            <label
              key={d.id}
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
                onChange={() => toggle(d.id)}
                className="h-4 w-4 accent-[#4ade80]"
              />
              <div>
                <p className="font-medium">{d.name}</p>
                <p className="text-xs text-white/40">{d.type}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
