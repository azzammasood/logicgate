"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { PageLoader } from "@/components/layout/PageLoader";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState("general");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [settings, setSettings] = useState<WorkspaceSettings>({});

  const { data: workspace, isLoading } = useQuery({
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
      setDescription(workspace.description ?? "");
      const url = workspace.logoUrl ?? "";
      setLogoUrl(url);
      setLogoPreview(url || null);
      setSettings((workspace.workspaceSettings as WorkspaceSettings) ?? {});
    }
  }, [workspace]);

  const uploadLogo = async (file: File) => {
    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/workspaces/logo", { method: "POST", body: form });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const url = json.data.logoUrl as string;
      setLogoUrl(url);
      setLogoPreview(url);
      toast.success("Icon uploaded — save to apply");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description.trim() || null,
          logoUrl: logoUrl.trim() || null,
          workspaceSettings: settings,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Configuration saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex h-full flex-col bg-[#0d0f14]">
      <Topbar title="Configuration">
        <Button
          className="bg-[#4ade80] text-black"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          Save
        </Button>
      </Topbar>
      <PageLoader active={isLoading} message="Loading…" />
      <Tabs value={tab} onValueChange={setTab} className="flex flex-1 flex-col">
        <TabsList className="mx-6 mt-4 w-fit bg-[#161920]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="sources">Data sources</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="max-w-xl space-y-5 p-6">
          <div className="space-y-2">
            <label className="text-xs text-white/50">Workspace name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-[#161920]" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/50">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this workspace is for…"
              className="min-h-[88px] bg-[#161920]"
              rows={3}
            />
          </div>
          <div className="space-y-3">
            <label className="text-xs text-white/50">Workspace icon</label>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#161920]">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-white/30">No icon</span>
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadLogo(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/10"
                  disabled={uploadingLogo}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploadingLogo ? "Uploading…" : "Browse image…"}
                </Button>
                <p className="text-[11px] text-white/35">
                  JPEG, PNG, WebP or GIF · max 2 MB · square images work best
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="sources" className="max-w-xl space-y-4 p-6">
          <p className="text-sm text-white/50">
            Configure source tables as JSON (table name and column list).
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
