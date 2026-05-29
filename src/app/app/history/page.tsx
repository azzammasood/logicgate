"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { useWorkspaceStore } from "@/stores/workspace";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type HistoryVersion = {
  id: string;
  version: number;
  changeDescription: string;
  createdAt: string;
  changedBy: { name: string; avatarInitials: string };
  definition: { id: string; name: string; type: string };
};

export default function HistoryPage() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["version-history", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/definitions/versions?workspaceId=${workspaceId}&limit=100`);
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!workspaceId,
  });

  const filtered = (versions as HistoryVersion[]).filter((v) => {
    const matchSearch =
      !debouncedSearch ||
      v.definition.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      v.changeDescription.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchType = typeFilter === "all" || v.definition.type === typeFilter;
    return matchSearch && matchType;
  });

  const searchResults =
    search.trim().length > 0
      ? (versions as HistoryVersion[])
          .filter(
            (v) =>
              v.definition.name.toLowerCase().includes(search.toLowerCase()) ||
              v.changeDescription.toLowerCase().includes(search.toLowerCase())
          )
          .slice(0, 8)
      : [];

  return (
    <div className="flex h-full flex-col bg-[#0d0f14]">
      <Topbar title="Version History" />
      <div className="flex flex-wrap gap-3 border-b border-white/10 px-6 py-4">
        <div className="relative w-full max-w-xs">
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            className="w-full bg-[#161920]"
          />
          {searchFocused && search.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-[var(--border-color)] bg-[var(--surface,#161920)] shadow-xl">
              {searchResults.length === 0 ? (
                <p className="px-3 py-3 text-xs text-[var(--fg-muted)]">No matching results.</p>
              ) : (
                searchResults.map((v) => (
                  <Link
                    key={v.id}
                    href={`/app/definitions/${v.definition.id}`}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-white/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--fg)]">{v.definition.name}</p>
                      <p className="truncate text-[11px] text-[var(--fg-muted)]">
                        {v.changeDescription}
                      </p>
                    </div>
                    <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-[var(--fg-muted)]">
                      v{v.version}
                    </span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-40 bg-[#161920]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="METRIC">Metric</SelectItem>
            <SelectItem value="RULE">Rule</SelectItem>
            <SelectItem value="FILTER">Filter</SelectItem>
            <SelectItem value="FLAG">Flag</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && <ListSkeleton rows={8} />}
        {!isLoading && filtered.length === 0 && <EmptyState variant="no-history" />}
        <div className="relative space-y-0">
          {filtered.map(
            (
              v: {
                id: string;
                version: number;
                changeDescription: string;
                createdAt: string;
                changedBy: { name: string; avatarInitials: string };
                definition: { id: string; name: string; type: string };
              },
              i: number
            ) => (
              <div key={v.id} className="relative flex gap-4 pb-8">
                {i < filtered.length - 1 && (
                  <div className="absolute left-[15px] top-8 h-full w-px bg-[var(--border-color)]" />
                )}
                <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--surface,#161920)] text-xs text-[var(--accent)]">
                  v{v.version}
                </div>
                <div className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--surface,#161920)] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/app/definitions/${v.definition.id}`}
                        className="font-medium text-[var(--accent)] hover:underline"
                      >
                        {v.definition.name}
                      </Link>
                      <p className="mt-1 text-sm text-[var(--fg)]/80">{v.changeDescription}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-[var(--fg-muted)]">
                      {v.definition.type}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[var(--fg-muted)]">
                    <Avatar className="h-5 w-5 items-center justify-center bg-[var(--accent)]/15 text-[9px] text-[var(--accent)]">
                      {v.changedBy?.avatarInitials}
                    </Avatar>
                    {v.changedBy?.name} ·{" "}
                    {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
