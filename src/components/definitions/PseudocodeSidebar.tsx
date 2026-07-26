"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
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

/**
 * The auto-compiled sidebar is the minimal view — strip comment-only lines
 * (`--`, `#`, `//`) and Python docstrings (`"""…"""`) so it reads as clean
 * code. Comments/docstrings are kept for the dedicated Pseudocodes page and
 * exports. Falls back to the raw code if stripping would leave nothing.
 */
function stripComments(code: string): string {
  let inDocstring = false;
  const stripped = code
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      // Drop triple-quoted docstrings, single- or multi-line.
      if (inDocstring) {
        if (t.endsWith('"""') || t.endsWith("'''")) inDocstring = false;
        return false;
      }
      if (t.startsWith('"""') || t.startsWith("'''")) {
        // Single-line docstring closes on the same line; otherwise it spans.
        const isSingleLine = t.length > 3 && (t.endsWith('"""') || t.endsWith("'''"));
        if (!isSingleLine) inDocstring = true;
        return false;
      }
      return !(t.startsWith("--") || t.startsWith("#") || t.startsWith("//"));
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return stripped || code.trim();
}

export function PseudocodeSidebar() {
  const definitionId = useDefinitionId();
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [format, setFormat] = useState<string>("generic");
  const lang = FORMATS.find((f) => f.id === format)?.lang ?? "sql";

  const { data: pseudocode, isFetching: pseudoFetching } = useQuery({
    queryKey: ["pseudocode", definitionId, format],
    queryFn: async () => {
      const res = await fetch(`/api/definitions/${definitionId}/pseudocode?format=${format}`);
      const json = await res.json();
      return json.data as { code: string; compiledAt: string } | null;
    },
    enabled: !!definitionId,
    // Keep the previous format's code on screen while the new one compiles so
    // the panel doesn't collapse and shove the version history around.
    placeholderData: keepPreviousData,
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
      <aside className="hidden w-[300px] shrink-0 border-l border-[var(--border-color)] bg-[var(--surface,#161920)] xl:flex xl:flex-col">
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <p className="text-xs text-[var(--fg-muted)]">
            Select a definition to view auto-compiled pseudocode.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden w-[300px] shrink-0 flex-col overflow-y-auto border-l border-[var(--border-color)] bg-[var(--surface,#161920)] xl:flex">
      <div className="border-b border-[var(--border-color)] px-4 py-3.5">
        <h3 className="text-[11px] font-medium text-[var(--fg)]">Auto-compiled Pseudocode</h3>
        <p className="text-[10px] text-[var(--text3)]">Updates on every save</p>
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

        <div className="relative min-h-[180px]">
          {pseudocode?.code ? (
            <PseudocodeBlock code={stripComments(pseudocode.code)} language={lang} compact />
          ) : (
            <div className="h-[180px] rounded-lg border border-[var(--border-color)] bg-[var(--background,#0d0f14)]/60" />
          )}
          {/* Loading overlay while (re)compiling a format. */}
          {pseudoFetching && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-[var(--background,#0d0f14)]/55 backdrop-blur-[1px]">
              <span className="flex items-center gap-2 rounded-full border border-[var(--accent)]/25 bg-[var(--surface,#161920)] px-3 py-1.5 text-[12px] text-[var(--accent)] shadow-lg">
                <span className="h-3 w-3 animate-spin rounded-full border border-[var(--accent)]/40 border-t-[var(--accent)]" />
                Compiling {FORMATS.find((f) => f.id === format)?.label ?? ""}…
              </span>
            </div>
          )}
        </div>

        <div>
          <p className="mb-1 text-[10px] text-[var(--text3)]">Version history</p>
          <ul>
            {versions.slice(0, 8).map((v, i) => (
              <li
                key={v.version}
                className="border-b border-[var(--border-color)] py-2.5 last:border-b-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={
                      i === 0
                        ? "rounded bg-[var(--accent-dim)] px-1.5 py-px text-[10px] text-[var(--accent)]"
                        : "rounded bg-[var(--surface3)] px-1.5 py-px text-[10px] text-[var(--text3)]"
                    }
                  >
                    v{v.version}
                  </span>
                  <span className="text-[10px] text-[var(--text3)]">
                    {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-[var(--text2)]">
                  {v.changeDescription ?? "Update"}
                </p>
                {v.changedBy?.name && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--blue-dim)] text-[7px] font-semibold text-[var(--blue)]">
                      {v.changedBy.avatarInitials ?? v.changedBy.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="truncate text-[10px] text-[var(--text3)]">
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
