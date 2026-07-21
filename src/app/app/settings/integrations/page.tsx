"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/stores/workspace";
import { toast } from "sonner";
import type { WorkspaceSettings } from "@/types";
import { Webhook, GitBranch, ExternalLink } from "lucide-react";

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
      <div className="lg-fade-up max-w-xl space-y-4 overflow-y-auto p-6">
        <p className="text-sm text-[var(--fg-muted)]">
          Connect LogicGate to the tools your team already uses. Both are optional.
        </p>

        <div className="space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface,#161920)] p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
              <Webhook className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--fg)]">Publish webhook</p>
              <p className="text-xs leading-relaxed text-[var(--fg-muted)]">
                We&apos;ll send a POST with the definition details every time one is
                published — wire it into Slack, Zapier, or your own service.
              </p>
            </div>
          </div>
          <Input
            value={settings.webhookUrl ?? ""}
            onChange={(e) => setSettings((s) => ({ ...s, webhookUrl: e.target.value }))}
            placeholder="https://hooks.example.com/…"
            className="bg-[var(--background,#0d0f14)] font-mono text-xs"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface,#161920)] p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#a78bfa]/12 text-[#a78bfa]">
              <GitBranch className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--fg)]">dbt project</p>
              <p className="text-xs leading-relaxed text-[var(--fg-muted)]">
                Link the repo that houses your dbt models so teammates can jump
                straight from a definition to its project.
              </p>
            </div>
          </div>
          <Input
            value={settings.dbtProjectUrl ?? ""}
            onChange={(e) => setSettings((s) => ({ ...s, dbtProjectUrl: e.target.value }))}
            placeholder="https://github.com/org/dbt-project"
            className="bg-[var(--background,#0d0f14)] font-mono text-xs"
          />
          {settings.dbtProjectUrl?.trim() && /^https?:\/\//i.test(settings.dbtProjectUrl.trim()) && (
            <a
              href={settings.dbtProjectUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
            >
              Open dbt project <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
