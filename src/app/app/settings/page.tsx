"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceStore } from "@/stores/workspace";
import { toast } from "sonner";
import type { WorkspaceSettings } from "@/types";
import { ImageCropperDialog } from "@/components/ui/ImageCropperDialog";
import { SourceTablesEditor } from "@/components/settings/SourceTablesEditor";
import { SettingToggle } from "@/components/settings/SettingToggle";
import { MessageSquareText, ShieldCheck } from "lucide-react";

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
  const [logoCropFile, setLogoCropFile] = useState<File | null>(null);
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

  // Tables referenced by existing definitions — surfaced here so the Data
  // sources page reflects what's actually in use (not just what's documented).
  const { data: definitions = [] } = useQuery({
    queryKey: ["definitions", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/definitions?workspaceId=${workspaceId}`);
      const json = await res.json();
      return (json.data ?? []) as { sourceTable: string | null }[];
    },
    enabled: !!workspaceId,
  });

  const documentedTables = settings.sourceTables ?? [];
  const displayedTables = useMemo(() => {
    const existing = new Set(documentedTables.map((t) => t.name.toLowerCase()));
    const detected = new Map<string, { name: string; columns: string[] }>();
    for (const d of definitions) {
      const t = (d.sourceTable ?? "").trim();
      if (t && !existing.has(t.toLowerCase()) && !detected.has(t.toLowerCase())) {
        detected.set(t.toLowerCase(), { name: t, columns: [] });
      }
    }
    return [...documentedTables, ...detected.values()];
  }, [documentedTables, definitions]);

  // The organization name is locked once other members have joined — renaming
  // it would be confusing for everyone else on the team.
  const memberCount = workspace?.members?.length ?? 1;
  const nameLocked = memberCount > 1;

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

  const uploadLogo = async (blob: Blob) => {
    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append("file", new File([blob], "logo.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/workspaces/logo", { method: "POST", body: form });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const url = json.data.logoUrl as string;
      setLogoUrl(url);
      setLogoPreview(url);
      toast.success("Icon uploaded — save to apply");
      setLogoCropFile(null);
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
          className="bg-[var(--accent)] text-black"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          Save
        </Button>
      </Topbar>
      <Tabs value={tab} onValueChange={setTab} className="flex flex-1 flex-col">
        <TabsList className="mx-6 mt-4 w-fit bg-[#161920]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="sources">Data sources</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="lg-fade-up max-w-xl space-y-5 p-6">
          <div className="space-y-2">
            <label className="text-xs text-white/50">Workspace name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={nameLocked}
              className="bg-[#161920] disabled:cursor-not-allowed disabled:opacity-60"
            />
            {nameLocked && (
              <p className="text-[11px] text-white/35">
                The name is locked because {memberCount - 1} other{" "}
                {memberCount - 1 === 1 ? "member has" : "members have"} joined.
                Everything else stays editable.
              </p>
            )}
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
                    if (file) setLogoCropFile(file);
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
        <TabsContent value="sources" className="lg-fade-up max-w-xl space-y-4 p-6">
          <SourceTablesEditor
            value={displayedTables}
            onChange={(sourceTables) => setSettings((s) => ({ ...s, sourceTables }))}
          />
        </TabsContent>
        <TabsContent value="workflow" className="lg-fade-up max-w-xl space-y-3 p-6">
          <p className="text-sm text-white/50">
            Guardrails for how changes get published in this workspace.
          </p>
          <SettingToggle
            icon={MessageSquareText}
            title="Require a change reason"
            description="Publishing must include an explanation of at least 20 characters, so every version has a documented reason."
            checked={!!settings.requireChangeReason}
            onChange={(v) => setSettings((s) => ({ ...s, requireChangeReason: v }))}
          />
          <SettingToggle
            icon={ShieldCheck}
            title="Require approval before publishing"
            description="Editors must open a change request and have it approved by a reviewer; only reviewers can publish directly."
            checked={!!settings.requireApprovalForPublish}
            onChange={(v) => setSettings((s) => ({ ...s, requireApprovalForPublish: v }))}
          />
        </TabsContent>
      </Tabs>

      <ImageCropperDialog
        file={logoCropFile}
        open={!!logoCropFile}
        onOpenChange={(o) => {
          if (!o) setLogoCropFile(null);
        }}
        onCropped={uploadLogo}
        shape="square"
        title="Crop workspace icon"
        busy={uploadingLogo}
      />
    </div>
  );
}
