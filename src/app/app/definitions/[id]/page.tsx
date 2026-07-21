"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisualBuilder } from "@/components/definitions/VisualBuilder";
import { ChangelogPanel } from "@/components/definitions/ChangelogPanel";
import { DiscussPanel } from "@/components/definitions/DiscussPanel";
import { DefinitionSettingsPanel } from "@/components/definitions/DefinitionSettingsPanel";
import { DefinitionSkeleton } from "@/components/skeletons/DefinitionSkeleton";
import { useWorkspaceStore } from "@/stores/workspace";
import { useRecentStore } from "@/stores/recent";
import type { WorkspaceSettings } from "@/types";

type PageProps = { params: Promise<{ id: string }> };

const VALID_TABS = ["builder", "changelog", "discuss", "settings"] as const;

export default function DefinitionDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const pushRecent = useRecentStore((s) => s.pushRecent);
  const [tab, setTab] = useState("builder");

  useEffect(() => {
    if (id) pushRecent(id);
  }, [id, pushRecent]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && (VALID_TABS as readonly string[]).includes(t)) {
      setTab(t);
    }
  }, [searchParams]);

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

  // Guard against a flash of a foreign definition right after switching orgs:
  // this record belongs to another workspace, so don't render it (the org rail
  // is navigating away). Showing the skeleton avoids the brief content flash.
  if (definition && definition.workspaceId && workspaceId && definition.workspaceId !== workspaceId) {
    return <DefinitionSkeleton />;
  }

  if (!definition) {
    return <p className="p-6 text-sm text-[var(--fg-muted)]">Definition not found.</p>;
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <TabsList className="mx-6 mt-4 w-fit shrink-0 bg-[var(--surface,#161920)]">
        <TabsTrigger value="builder">Visual Builder</TabsTrigger>
        <TabsTrigger value="changelog">Changelog</TabsTrigger>
        <TabsTrigger value="discuss">Discuss</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="builder" className="min-h-0 flex-1 overflow-y-auto">
        <div className="lg-fade-up px-6 pt-5">
          <h1 className="font-[family-name:var(--app-font)] text-2xl font-bold leading-tight text-[var(--fg)]">
            {definition.name}
          </h1>
          {definition.description && (
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[var(--fg-muted)]">
              {definition.description}
            </p>
          )}
        </div>
        <VisualBuilder
          definition={{
            id: definition.id,
            name: definition.name,
            type: definition.type,
            documentation: definition.documentation,
            sourceTable: definition.sourceTable,
            sourceValueField: definition.sourceValueField,
            sourceDateField: definition.sourceDateField,
            currency: definition.currency,
            joins: definition.joins ?? [],
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
