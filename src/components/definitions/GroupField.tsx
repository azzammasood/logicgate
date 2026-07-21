"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type Group = { id: string; name: string; color?: string | null };

/** De-duplicate groups by (case-insensitive) name — older data may repeat. */
export function dedupeGroups(groups: Group[]): Group[] {
  const seen = new Set<string>();
  return groups.filter((g) => {
    const key = g.name.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Combined "pick existing / create new / none" group selector. */
export function GroupField({
  groups,
  groupId,
  newGroupName,
  onPick,
  onCreate,
  onClear,
}: {
  groups: Group[];
  groupId: string;
  newGroupName: string;
  onPick: (id: string) => void;
  onCreate: (name: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const unique = useMemo(() => dedupeGroups(groups), [groups]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q ? unique.filter((g) => g.name.toLowerCase().includes(q)) : unique;
  const exactMatch = unique.some((g) => g.name.toLowerCase() === q);
  const selectedName = groupId ? unique.find((g) => g.id === groupId)?.name : null;
  const label = selectedName ?? (newGroupName ? `${newGroupName} (new)` : null);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-[var(--background,#0d0f14)] px-3 py-2 text-left text-sm transition-colors hover:border-white/20"
      >
        <span className={cn("min-w-0 flex-1 truncate", label ? "text-white/90" : "text-white/35")}>
          {label ?? "No group"}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/40 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-[210] mt-1.5 w-full overflow-hidden rounded-lg border border-white/10 bg-[#161920] shadow-2xl">
          <div className="border-b border-white/10 p-2">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or type a new group…"
              className="bg-[var(--background,#0d0f14)]"
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
                setQuery("");
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-white/5",
                !groupId && !newGroupName ? "text-white/90" : "text-white/60"
              )}
            >
              <Check className={cn("h-3.5 w-3.5 shrink-0", !groupId && !newGroupName ? "text-[var(--accent)]" : "text-transparent")} />
              <X className="h-3 w-3 text-white/30" />
              No group
            </button>

            {filtered.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  onPick(g.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-white/5",
                  groupId === g.id ? "text-white/90" : "text-white/70"
                )}
              >
                <Check className={cn("h-3.5 w-3.5 shrink-0", groupId === g.id ? "text-[var(--accent)]" : "text-transparent")} />
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: g.color ?? "#4ade80" }} />
                <span className="truncate">{g.name}</span>
              </button>
            ))}

            {q && !exactMatch && (
              <button
                type="button"
                onClick={() => {
                  onCreate(query.trim());
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                Create “{query.trim()}”
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
