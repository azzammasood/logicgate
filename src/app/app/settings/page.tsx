"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceStore } from "@/stores/workspace";
import { toast } from "sonner";
import type { WorkspaceSettings } from "@/types";

export default function SettingsPage() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const qc = useQueryClient();
  const [tab, setTab] = useState("general");
  const [name, setName] = useState("");
  const [settings, setSettings] = useState<WorkspaceSettings>({});

  const { data: workspace } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!workspaceId,
  });

  useEffect(() => {
    if (workspace) {
      setName(workspace.name ?? "");
      setSettings((workspace.workspaceSettings as WorkspaceSettings) ?? {});
    }
  }, [workspace]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, workspaceSettings: settings }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex h-full flex-col bg-[#0d0f14]">
      <Topbar title="Pipeline Config">
        <Button
          className="bg-[#4ade80] text-black"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          Save
        </Button>
      </Topbar>
      <Tabs value={tab} onValueChange={setTab} className="flex flex-1 flex-col">
        <TabsList className="mx-6 mt-4 w-fit bg-[#161920]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="max-w-xl space-y-4 p-6">
          <div className="space-y-2">
            <label className="text-xs text-white/50">Workspace name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-[#161920]" />
          </div>
        </TabsContent>
        <TabsContent value="sources" className="max-w-xl space-y-4 p-6">
          <p className="text-sm text-white/50">
            Configure source tables as JSON in workspace settings (name + columns).
          </p>
          <Textarea
            className="min-h-[200px] bg-[#161920] font-mono text-xs"
            value={JSON.stringify(settings.sourceTables ?? [], null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setSettings((s) => ({ ...s, sourceTables: parsed }));
              } catch {
                /* ignore invalid json while typing */
              }
            }}
          />
        </TabsContent>
        <TabsContent value="workflow" className="max-w-xl space-y-4 p-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!settings.requireChangeReason}
              onChange={(e) =>
                setSettings((s) => ({ ...s, requireChangeReason: e.target.checked }))
              }
              className="accent-[#4ade80]"
            />
            Require change reason (min 20 chars)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!settings.requireApprovalForPublish}
              onChange={(e) =>
                setSettings((s) => ({ ...s, requireApprovalForPublish: e.target.checked }))
              }
              className="accent-[#4ade80]"
            />
            Require approval before publish
          </label>
        </TabsContent>
      </Tabs>
    </div>
  );
}
