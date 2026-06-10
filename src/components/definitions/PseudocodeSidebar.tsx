"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace";
import { PseudocodeBlock } from "@/components/definitions/PseudocodeBlock";
import { cn } from "@/lib/utils";

const FORMATS = [
  { id: "generic", label: "Generic", lang: "sql" },
  { id: "sql", label: "SQL", lang: "sql" },
  { id: "python", label: "Python", lang: "python" },
  { id: "dbt", label: "dbt", lang: "sql" },
] as const;

type Version = {
  version: number;
  changeDescription: string | null;
  createdAt: string;
  changedBy?: { name: string; avatarInitials?: string } | null;
};

type ChangeRequest = {
  id: string;
  definitionId: string;
  changeDescription: string;
  createdAt: string;
  requestedBy?: { name: string } | null;
};

function useDefinitionId() {
  const pathname = usePathname();
  return pathname.match(/\/app\/definitions\/([^/]+)/)?.[1] ?? null;
}

export function PseudocodeSidebar() {
  const definitionId = useDefinitionId();
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [format, setFormat] = useState<string>("generic");
  const lang = FORMATS.find((f) => f.id === format)?.lang ?? "sql";

  const { data: pseudocode } = useQuery({
    queryKey: ["pseudocode", definitionId, format],
    queryFn: async () => {
      const res = await fetch(`/api/definitions/${definitionId}/pseudocode?format=${format}`);
      const json = await res.json();
      return json.data as { code: string; compiledAt: string } | null;
    },
    enabled: !!definitionId,
  });

  const { data: versions = [] } = useQuery({
    queryKey: ["versions", definitionId],
    queryFn: async () => {
      const res = await fetch(`/api/definitions/${definitionId}/versions`);
      const json = await res.json();
      return (json.data ?? []) as Version[];
    },
    enabled: !!definitionId,
  });

  const { data: pendingForDef } = useQuery({
    queryKey: ["change-requests", workspaceId, "PENDING", definitionId],
    queryFn: async () => {
      const res = await fetch(
        `/api/change-requests?workspaceId=${workspaceId}&status=PENDING`
      );
      const json = await res.json();
      const list = (json.data ?? []) as ChangeRequest[];
      return list.find((c) => c.definitionId === definitionId) ?? null;
    },
    enabled: !!definitionId && !!workspaceId,
  });

  if (!definitionId) {
    return (
      <aside className="hidden w-[380px] shrink-0 border-l border-[var(--border-color)] bg-[var(--surface,#161920)] xl:flex xl:flex-col">
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <p className="text-xs text-[var(--fg-muted)]">
            Select a definition to view auto-compiled pseudocode.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden w-[380px] shrink-0 flex-col overflow-y-auto border-l border-[var(--border-color)] bg-[var(--surface,#161920)] xl:flex">
      <div className="border-b border-[var(--border-color)] px-4 py-3">
        <h3 className="text-sm font-medium text-[var(--fg)]">Auto-compiled Pseudocode</h3>
        <p className="text-[10px] text-[var(--fg-muted)]">Updates on every save</p>
      </div>

      <div className="space-y-4 p-4">
        {pendingForDef && (
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              Pending change
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-200/80">
              {pendingForDef.requestedBy?.name ?? "Someone"} requested a change{" "}
              {formatDistanceToNow(new Date(pendingForDef.createdAt), { addSuffix: true })}. Awaiting
              approval before publishing.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              className={cn(
                "rounded px-2 py-1 text-[10px] font-medium transition-colors",
                format === f.id
                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "text-[var(--fg-muted)] hover:bg-white/5"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {pseudocode?.code ? (
          <PseudocodeBlock code={pseudocode.code} language={lang} />
        ) : (
          <p className="text-[12px] text-[var(--fg-muted)]">Compiling…</p>
        )}

        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
            Version history
          </p>
          <ul className="space-y-3">
            {versions.slice(0, 8).map((v, i) => (
              <li
                key={v.version}
                className="rounded-lg border border-[var(--border-color)] bg-[var(--background,#0d0f14)]/60 p-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={
                      i === 0
                        ? "rounded bg-[var(--accent)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]"
                        : "rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--fg-muted)]"
                    }
                  >
                    v{v.version}
                  </span>
                  <span className="text-[10px] text-[var(--fg-muted)]">
                    {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[11px] text-[var(--fg)]/85">
                  {v.changeDescription ?? "Update"}
                </p>
                {v.changedBy?.name && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[8px] font-semibold text-[var(--accent)]">
                      {v.changedBy.avatarInitials ?? v.changedBy.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="truncate text-[10px] text-[var(--fg-muted)]">
                      {v.changedBy.name}
                    </span>
                  </div>
                )}
              </li>
            ))}
            {versions.length === 0 && (
              <li className="text-[11px] text-[var(--fg-muted)]">No versions yet.</li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
