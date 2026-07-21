"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspaceStore } from "@/stores/workspace";
import { actionOverlay } from "@/stores/actionOverlay";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Group = { id: string; name: string; color?: string | null };

/** Combined group picker + creator with de-duplicated options. */
function GroupField({
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

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q ? groups.filter((g) => g.name.toLowerCase().includes(q)) : groups;
  const exactMatch = groups.some((g) => g.name.toLowerCase() === q);
  const selectedName = groupId ? groups.find((g) => g.id === groupId)?.name : null;

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
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: g.color ?? "#4ade80" }}
                />
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

const selectContentClass =
  "z-[200] max-h-60 w-[var(--anchor-width)] border border-white/10 bg-[#161920] text-white shadow-xl";
const selectTriggerClass = "w-full bg-[var(--background,#0d0f14)]";

const GROUP_COLORS = ["#4ade80", "#60a5fa", "#a78bfa", "#fbbf24", "#f87171", "#22d3ee"];

const TYPE_OPTIONS = [
  { value: "METRIC", label: "Metric" },
  { value: "RULE", label: "Rule" },
  { value: "FILTER", label: "Filter" },
  { value: "FLAG", label: "Flag" },
] as const;

export function CreateDefinitionDialog({ variant }: { variant?: "compact" }) {
  const compact = variant === "compact";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("METRIC");
  const [groupId, setGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [description, setDescription] = useState("");
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const router = useRouter();
  const qc = useQueryClient();

  const { data: groups = [] } = useQuery({
    queryKey: ["groups", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/groups?workspaceId=${workspaceId}`);
      const json = await res.json();
      return (json.data ?? []) as Group[];
    },
    enabled: !!workspaceId && open,
  });

  // De-duplicate groups by name (older data may contain repeats).
  const uniqueGroups = useMemo(() => {
    const seen = new Set<string>();
    return groups.filter((g) => {
      const key = g.name.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [groups]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId) {
        throw new Error("Select an organization first (left panel).");
      }

      let resolvedGroupId: string | null = groupId || null;
      const trimmedNew = newGroupName.trim();

      if (trimmedNew) {
        // Reuse an existing group with the same name instead of duplicating it.
        const existing = uniqueGroups.find(
          (g) => g.name.trim().toLowerCase() === trimmedNew.toLowerCase()
        );
        if (existing) {
          resolvedGroupId = existing.id;
        } else {
          const groupRes = await fetch("/api/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: trimmedNew,
              workspaceId,
              color: GROUP_COLORS[uniqueGroups.length % GROUP_COLORS.length],
            }),
          });
          const groupJson = await groupRes.json();
          if (groupJson.error) throw new Error(groupJson.error);
          resolvedGroupId = groupJson.data.id;
        }
      }

      const res = await fetch("/api/definitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          workspaceId,
          groupId: resolvedGroupId,
          description: description || null,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onMutate: () => actionOverlay.show("Creating definition"),
    onSettled: () => actionOverlay.hide(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["definitions"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
      setOpen(false);
      resetForm();
      toast.success("Definition created");
      router.push(`/app/definitions/${data.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function resetForm() {
    setName("");
    setType("METRIC");
    setGroupId("");
    setNewGroupName("");
    setDescription("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          compact
            ? "rounded-md border border-white/20 px-2.5 py-1 text-xs font-medium text-white/80 hover:bg-white/5"
            : "w-full rounded-md bg-[var(--accent,#4ade80)] px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
        )}
        disabled={!workspaceId}
      >
        New
      </DialogTrigger>
      <DialogContent className="overflow-visible border-white/10 bg-[#161920] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create definition</DialogTitle>
        </DialogHeader>
        {!workspaceId && (
          <p className="text-sm text-amber-400">
            Create or select an organization in the left panel first.
          </p>
        )}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.length < 2) return;
            mutation.mutate();
          }}
        >
          <Input
            placeholder="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            className="bg-[var(--background,#0d0f14)]"
          />
          <div className="space-y-2">
            <label className="text-xs text-white/50">Type</label>
            <Select value={type} onValueChange={(v) => v && setType(v)}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Type">
                  {TYPE_OPTIONS.find((t) => t.value === type)?.label ?? "Type"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/50">Group</label>
            <GroupField
              groups={uniqueGroups}
              groupId={groupId}
              newGroupName={newGroupName}
              onPick={(id) => {
                setGroupId(id);
                setNewGroupName("");
              }}
              onCreate={(nm) => {
                setNewGroupName(nm);
                setGroupId("");
              }}
              onClear={() => {
                setGroupId("");
                setNewGroupName("");
              }}
            />
          </div>

          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-[var(--background,#0d0f14)]"
          />
          <Button
            type="submit"
            disabled={mutation.isPending || !workspaceId}
            className="w-full bg-[var(--accent,#4ade80)] text-black"
          >
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
