"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisualBuilder } from "@/components/definitions/VisualBuilder";
import { PseudocodePanel } from "@/components/definitions/PseudocodePanel";
import { ChangelogPanel } from "@/components/definitions/ChangelogPanel";
import { DiscussPanel } from "@/components/definitions/DiscussPanel";
import { DefinitionSettingsPanel } from "@/components/definitions/DefinitionSettingsPanel";
import { DefinitionSkeleton } from "@/components/skeletons/DefinitionSkeleton";
import { useWorkspaceStore } from "@/stores/workspace";
import { cn } from "@/lib/utils";
import type { WorkspaceSettings } from "@/types";

type PageProps = { params: Promise<{ id: string }> };

const statusStyles: Record<string, string> = {
  PUBLISHED: "bg-[var(--accent)]/15 text-[var(--accent)]",
  DRAFT: "bg-white/10 text-[var(--fg-muted)]",
  PENDING_REVIEW: "bg-amber-500/15 text-amber-400",
  DEPRECATED: "bg-red-500/15 text-red-400",
};

export default function DefinitionDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [tab, setTab] = useState("builder");

  const { data: definition, isLoading, refetch } = useQuery({
    queryKey: ["definition", id],
    queryFn: async () => {
      const res = await fetch(`/api/definitions/${id}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });

  const { data: workspace } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!workspaceId,
    staleTime: 60_000,
  });

  const { data: authMe } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      return json.data;
    },
    staleTime: 60_000,
  });

  const members =
    workspace?.members?.map(
      (m: { user: { id: string; name: string; email: string; avatarInitials: string } }) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarInitials: m.user.avatarInitials,
      })
    ) ?? [];

  const settings = (workspace?.workspaceSettings ?? {}) as WorkspaceSettings;

  if (isLoading) {
    return <DefinitionSkeleton />;
  }

  if (!definition) {
    return <p className="p-6 text-sm text-[var(--fg-muted)]">Definition not found.</p>;
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <TabsList className="mx-6 mt-4 w-fit shrink-0 bg-[var(--surface,#161920)]">
        <TabsTrigger value="builder">Visual Builder</TabsTrigger>
        <TabsTrigger value="pseudocode">Pseudocode</TabsTrigger>
        <TabsTrigger value="changelog">Changelog</TabsTrigger>
        <TabsTrigger value="discuss">Discuss</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="builder" className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-6 pt-6">
          <div className="flex items-center gap-3">
            <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-[var(--fg)]">
              {definition.name}
            </h1>
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                statusStyles[definition.status] ?? statusStyles.DRAFT
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {definition.status.toLowerCase().replace("_", " ")}
            </span>
          </div>
          {definition.description && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--fg-muted)]">
              {definition.description}
            </p>
          )}
        </div>
        <VisualBuilder
          definition={{
            id: definition.id,
            sourceTable: definition.sourceTable,
            sourceValueField: definition.sourceValueField,
            sourceDateField: definition.sourceDateField,
            currency: definition.currency,
            aggregationFn: definition.aggregationFn,
            groupByPeriod: definition.groupByPeriod,
            dedupeBy: definition.dedupeBy,
            dedupeStrategy: definition.dedupeStrategy,
            ownerId: definition.ownerId,
            approverId: definition.approverId,
            owners: definition.owners ?? [],
            conditions: definition.conditions ?? [],
          }}
          workspaceSettings={settings}
          members={members}
          onSaved={() => refetch()}
        />
      </TabsContent>

      <TabsContent value="pseudocode" className="min-h-0 flex-1 overflow-hidden">
        <PseudocodePanel definitionId={id} />
      </TabsContent>

      <TabsContent value="changelog" className="min-h-0 flex-1 overflow-y-auto">
        <ChangelogPanel definitionId={id} onRestored={() => refetch()} />
      </TabsContent>

      <TabsContent value="discuss" className="min-h-0 flex-1 overflow-hidden">
        <DiscussPanel definitionId={id} currentUserId={authMe?.user?.id} />
      </TabsContent>

      <TabsContent value="settings" className="min-h-0 flex-1 overflow-y-auto">
        <DefinitionSettingsPanel
          definition={{
            id: definition.id,
            name: definition.name,
            description: definition.description,
            type: definition.type,
            groupId: definition.groupId,
          }}
          onSaved={() => refetch()}
        />
      </TabsContent>
    </Tabs>
  );
}
