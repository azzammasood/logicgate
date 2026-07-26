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
      {(() => {
        // Editor-tab treatment from the design mockup: flat strip on the
        // surface, right borders between tabs, 2px accent underline on active.
        const tabClass =
          "h-full flex-none rounded-none border-y-0 border-l-0 border-r border-[var(--border-color)] border-b-2 border-b-transparent px-[18px] text-[11px] text-[var(--text3)] shadow-none hover:text-[var(--text2)] data-active:border-b-[var(--accent)] data-active:bg-[var(--background)] data-active:text-[var(--fg)] dark:data-active:border-r-[var(--border-color)] dark:data-active:border-b-[var(--accent)] dark:data-active:bg-[var(--background)]";
        return (
          <TabsList className="h-10 w-full shrink-0 justify-start gap-0 rounded-none border-b border-[var(--border-color)] bg-[var(--surface,#161920)] p-0">
            <TabsTrigger value="builder" className={tabClass}>Visual Builder</TabsTrigger>
            <TabsTrigger value="changelog" className={tabClass}>Changelog</TabsTrigger>
            <TabsTrigger value="discuss" className={tabClass}>Discuss</TabsTrigger>
            <TabsTrigger value="settings" className={tabClass}>Settings</TabsTrigger>
          </TabsList>
        );
      })()}

      <TabsContent value="builder" className="min-h-0 flex-1 overflow-y-auto">
        <div className="lg-fade-up px-6 pt-5">
          <h1 className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-normal text-[var(--fg)]">
            {definition.name}
          </h1>
          {definition.description && (
            <p className="mt-1 max-w-3xl text-xs leading-[1.7] text-[var(--text2)]">
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
