"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, subHours, isAfter } from "date-fns";
import { Input } from "@/components/ui/input";
import { CreateDefinitionDialog } from "@/components/definitions/CreateDefinitionDialog";
import { useWorkspaceStore } from "@/stores/workspace";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const typeColors: Record<string, string> = {
  METRIC: "bg-blue-500/20 text-blue-400",
  RULE: "bg-purple-500/20 text-purple-400",
  FILTER: "bg-amber-500/20 text-amber-400",
  FLAG: "bg-red-500/20 text-red-400",
};

type DefinitionRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  updatedAt: string;
  group?: { name: string; color: string } | null;
};

type StatusFilter = "active" | "deprecated" | "all";

export function DefinitionsListPanel() {
  const pathname = usePathname();
  const selectedId = pathname.match(/\/app\/definitions\/([^/]+)/)?.[1] ?? null;
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: definitions = [], isLoading } = useQuery({
    queryKey: ["definitions", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/definitions?workspaceId=${workspaceId}`);
      const json = await res.json();
      return (json.data ?? []) as DefinitionRow[];
    },
    enabled: !!workspaceId,
  });

  const deprecatedCount = useMemo(
    () => definitions.filter((d) => d.status === "DEPRECATED").length,
    [definitions]
  );

  const filtered = useMemo(() => {
    let list = definitions;
    if (statusFilter === "active") list = list.filter((d) => d.status !== "DEPRECATED");
    else if (statusFilter === "deprecated")
      list = list.filter((d) => d.status === "DEPRECATED");
    if (debouncedSearch) {
      list = list.filter((d) =>
        d.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    return list;
  }, [definitions, debouncedSearch, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, DefinitionRow[]>();
    for (const d of filtered) {
      const key = d.group?.name ?? "Ungrouped";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    const entries = Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "Ungrouped") return 1;
      if (b === "Ungrouped") return -1;
      return a.localeCompare(b);
    });
    return entries;
  }, [filtered]);

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-white/10 bg-[var(--surface,#161920)]">
      <div className="border-b border-white/10 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-white/70">All Definitions</h2>
          <CreateDefinitionDialog variant="compact" />
        </div>
        <Input
          placeholder="Search definitions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-full bg-[var(--background,#0d0f14)] text-xs"
        />
        <div className="mt-2 flex items-center gap-1">
          {([
            { id: "active", label: "Active" },
            { id: "deprecated", label: `Deprecated${deprecatedCount ? ` (${deprecatedCount})` : ""}` },
            { id: "all", label: "All" },
          ] as { id: StatusFilter; label: string }[]).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                statusFilter === f.id
                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "text-[var(--fg-muted)] hover:bg-white/5"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-3">
        {isLoading && <p className="px-1 text-xs text-white/40">Loading…</p>}
        {!isLoading && definitions.length === 0 && (
          <p className="px-1 text-xs text-white/40">
            No definitions yet. Click New to create one.
          </p>
        )}
        {!isLoading && definitions.length > 0 && filtered.length === 0 && (
          <p className="text-xs text-white/40">No definitions match your search.</p>
        )}
        {grouped.map(([groupName, defs]) => (
          <div key={groupName}>
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
              {groupName}
            </p>
            <ul className="space-y-0.5">
              {defs.map((d) => {
                const active = selectedId === d.id;
                const recent = isAfter(new Date(d.updatedAt), subHours(new Date(), 24));
                return (
                  <li key={d.id}>
                    <Link
                      href={`/app/definitions/${d.id}`}
                      className={cn(
                        "block rounded-md px-2 py-2 transition-colors",
                        active
                          ? "bg-[var(--accent,#4ade80)]/15 ring-1 ring-[var(--accent,#4ade80)]/30"
                          : "hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "line-clamp-2 text-sm leading-snug",
                            active ? "text-white" : "text-white/85"
                          )}
                        >
                          {d.name}
                        </span>
                        <span className="flex shrink-0 items-center gap-1 pt-0.5">
                          {recent && (
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-amber-400"
                              title="Updated in last 24h"
                            />
                          )}
                          <span className="whitespace-nowrap text-[10px] text-white/30">
                            {formatDistanceToNow(new Date(d.updatedAt), {
                              addSuffix: false,
                            })}
                          </span>
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium capitalize",
                            typeColors[d.type]
                          )}
                        >
                          {d.type.toLowerCase()}
                        </span>
                        {d.status === "DEPRECATED" && (
                          <span className="inline-block rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--fg-muted)]">
                            deprecated
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
