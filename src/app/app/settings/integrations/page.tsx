"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/stores/workspace";
import { toast } from "sonner";
import type { WorkspaceSettings } from "@/types";

export default function IntegrationsPage() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const qc = useQueryClient();
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
    if (workspace) setSettings((workspace.workspaceSettings as WorkspaceSettings) ?? {});
  }, [workspace]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceSettings: settings }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      toast.success("Integrations saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex h-full flex-col bg-[var(--background,#0d0f14)]">
      <Topbar title="Integrations">
        <Button
          className="bg-[var(--accent)] text-black"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          Save
        </Button>
      </Topbar>
      <div className="max-w-xl space-y-5 overflow-y-auto p-6">
        <div className="space-y-2">
          <label className="text-xs text-[var(--fg-muted)]">Webhook URL</label>
          <Input
            value={settings.webhookUrl ?? ""}
            onChange={(e) => setSettings((s) => ({ ...s, webhookUrl: e.target.value }))}
            placeholder="https://hooks.example.com/…"
            className="bg-[var(--surface,#161920)]"
          />
          <p className="text-[11px] text-[var(--fg-muted)]">
            Receive a POST whenever a definition is published.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[var(--fg-muted)]">dbt project URL</label>
          <Input
            value={settings.dbtProjectUrl ?? ""}
            onChange={(e) => setSettings((s) => ({ ...s, dbtProjectUrl: e.target.value }))}
            placeholder="https://github.com/org/dbt-project"
            className="bg-[var(--surface,#161920)]"
          />
          <p className="text-[11px] text-[var(--fg-muted)]">
            Link exported pseudocode back to your dbt repo.
          </p>
        </div>
      </div>
    </div>
  );
}
