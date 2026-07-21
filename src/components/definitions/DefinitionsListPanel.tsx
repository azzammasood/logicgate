"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, subHours, isAfter } from "date-fns";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreateDefinitionDialog } from "@/components/definitions/CreateDefinitionDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceStore } from "@/stores/workspace";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type DefinitionRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  updatedAt: string;
  sortOrder?: number;
  group?: { name: string; color: string } | null;
};

type StatusFilter = "active" | "deprecated" | "all";

export function DefinitionsListPanel() {
  const pathname = usePathname();
  const selectedId = pathname.match(/\/app\/definitions\/([^/]+)/)?.[1] ?? null;
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const qc = useQueryClient();
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
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q) ||
          (d.group?.name ?? "").toLowerCase().includes(q)
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
    // Manual order within each group (stable sort keeps recency as tiebreaker).
    for (const list of map.values()) {
      list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    const entries = Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "Ungrouped") return 1;
      if (b === "Ungrouped") return -1;
      return a.localeCompare(b);
    });
    return entries;
  }, [filtered]);

  const reorder = useMutation({
    mutationFn: async (ids: string[]) => {
      await fetch("/api/definitions/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, ids }),
      });
    },
  });

  const handleReorder = (orderedIds: string[]) => {
    // Optimistically write the new order into the cached list.
    qc.setQueryData<DefinitionRow[]>(["definitions", workspaceId], (old) => {
      if (!old) return old;
      const pos = new Map(orderedIds.map((id, i) => [id, i]));
      return old.map((d) => (pos.has(d.id) ? { ...d, sortOrder: pos.get(d.id)! } : d));
    });
    reorder.mutate(orderedIds);
  };

  return (
    <aside className="relative flex w-[280px] shrink-0 flex-col border-r border-white/10 bg-[var(--surface,#161920)]">
      <div className="border-b border-white/10 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-white/70">All Definitions</h2>
          <CreateDefinitionDialog variant="compact" />
        </div>
        <Input
          placeholder="Search name, type, or group…"
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
        {isLoading && (
          <div className="space-y-2 px-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-md p-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-14" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && definitions.length === 0 && (
          <div className="lg-fade-up px-1 pt-6 text-center">
            <p className="text-xs text-white/45">No definitions yet.</p>
            <p className="mt-1 text-[11px] text-white/30">
              Click <span className="text-[var(--accent)]">New</span> to create your first one.
            </p>
          </div>
        )}
        {!isLoading && definitions.length > 0 && filtered.length === 0 && (
          <p className="text-xs text-white/40">No definitions match your search.</p>
        )}
        {grouped.map(([groupName, defs]) => (
          <GroupList
            key={groupName}
            groupName={groupName}
            defs={defs}
            selectedId={selectedId}
            sortable={!debouncedSearch}
            onReorder={handleReorder}
          />
        ))}
      </div>
    </aside>
  );
}

function RowLink({ d, active }: { d: DefinitionRow; active: boolean }) {
  const recent = isAfter(new Date(d.updatedAt), subHours(new Date(), 24));
  return (
    <Link
      href={`/app/definitions/${d.id}`}
      className={cn(
        "relative block min-w-0 flex-1 rounded-md px-2 py-2 transition-all duration-150",
        active
          ? "bg-[var(--accent,#4ade80)]/15 ring-1 ring-[var(--accent,#4ade80)]/30"
          : "hover:bg-white/5"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-[var(--accent,#4ade80)]" />
      )}
      <span
        className={cn(
          "line-clamp-2 text-sm leading-snug",
          active ? "text-white" : "text-white/85"
        )}
      >
        {d.name}
      </span>
      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-white/35">
        {recent && (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Updated in last 24h" />
        )}
        <span className="capitalize">{d.type.toLowerCase()}</span>
        <span>·</span>
        <span className="whitespace-nowrap">
          {formatDistanceToNow(new Date(d.updatedAt), { addSuffix: false })}
        </span>
        {d.status === "DEPRECATED" && (
          <>
            <span>·</span>
            <span>deprecated</span>
          </>
        )}
      </div>
    </Link>
  );
}

function SortableRow({ d, active }: { d: DefinitionRow; active: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: d.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn("group/row flex items-center gap-0.5", isDragging && "z-10 opacity-70")}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${d.name}`}
        tabIndex={-1}
        className="shrink-0 cursor-grab touch-none rounded p-0.5 text-white/20 opacity-0 transition-opacity hover:text-white/50 group-hover/row:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <RowLink d={d} active={active} />
    </li>
  );
}

function GroupList({
  groupName,
  defs,
  selectedId,
  sortable,
  onReorder,
}: {
  groupName: string;
  defs: DefinitionRow[];
  selectedId: string | null;
  sortable: boolean;
  onReorder: (orderedIds: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = defs.findIndex((d) => d.id === active.id);
    const newIndex = defs.findIndex((d) => d.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(defs, oldIndex, newIndex).map((d) => d.id));
  };

  const header = (
    <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
      {groupName}
    </p>
  );

  if (!sortable) {
    return (
      <div>
        {header}
        <ul className="lg-stagger space-y-0.5">
          {defs.map((d) => (
            <li key={d.id}>
              <RowLink d={d} active={selectedId === d.id} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      {header}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={defs.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <ul className="lg-stagger space-y-0.5">
            {defs.map((d) => (
              <SortableRow key={d.id} d={d} active={selectedId === d.id} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
