"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SectionCard, FieldRow } from "@/components/definitions/sections/SectionShell";
import { useWorkspaceStore } from "@/stores/workspace";
import { actionOverlay } from "@/stores/actionOverlay";
import { toast } from "sonner";
import { Settings as SettingsIcon } from "lucide-react";

const triggerClass = "h-9 w-full bg-[var(--background,#0d0f14)]";
const contentClass = "z-[200] border border-white/10 bg-[#161920] text-white shadow-xl";
const GROUP_COLORS = ["#4ade80", "#60a5fa", "#a78bfa", "#fbbf24", "#f87171", "#22d3ee"];
const typeLabels: Record<string, string> = {
  METRIC: "Metric",
  RULE: "Rule",
  FILTER: "Filter",
  FLAG: "Flag",
};

type Definition = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  groupId: string | null;
};

export function DefinitionSettingsPanel({
  definition,
  onSaved,
}: {
  definition: Definition;
  onSaved?: () => void;
}) {
  const qc = useQueryClient();
  const router = useRouter();
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const [name, setName] = useState(definition.name);
  const [description, setDescription] = useState(definition.description ?? "");
  const [type, setType] = useState(definition.type);
  const [groupId, setGroupId] = useState(definition.groupId ?? "__none__");
  const [newGroup, setNewGroup] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setName(definition.name);
    setDescription(definition.description ?? "");
    setType(definition.type);
    setGroupId(definition.groupId ?? "__none__");
    setNewGroup("");
  }, [definition.id, definition.name, definition.description, definition.type, definition.groupId]);

  const { data: groups } = useQuery({
    queryKey: ["groups", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/groups?workspaceId=${workspaceId}`);
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!workspaceId,
  });

  const save = useMutation({
    mutationFn: async () => {
      let resolvedGroupId: string | null = groupId === "__none__" ? null : groupId;
      const trimmedNew = newGroup.trim();
      if (trimmedNew) {
        const gRes = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedNew,
            workspaceId,
            color: GROUP_COLORS[(groups?.length ?? 0) % GROUP_COLORS.length],
          }),
        });
        const gJson = await gRes.json();
        if (gJson.error) throw new Error(gJson.error);
        resolvedGroupId = gJson.data.id;
      }
      const res = await fetch(`/api/definitions/${definition.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          type,
          groupId: resolvedGroupId,
          changeDescription: "Updated settings",
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onMutate: () => actionOverlay.show("Saving settings"),
    onSettled: () => actionOverlay.hide(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["definition", definition.id] });
      qc.invalidateQueries({ queryKey: ["definitions"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
      setNewGroup("");
      onSaved?.();
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/definitions/${definition.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onMutate: () => actionOverlay.show("Deleting definition"),
    onSettled: () => actionOverlay.hide(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["definitions"] });
      toast.success("Definition deleted");
      setConfirmDelete(false);
      router.push("/app/definitions");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5 px-6 pb-8 pt-4">
      <SectionCard icon={SettingsIcon} title="Definition settings" rightLabel="Edit details">
        <div className="space-y-1">
          <FieldRow label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} className={triggerClass} />
          </FieldRow>
          <FieldRow label="Type">
            <Select value={type} onValueChange={(v) => v && setType(v)}>
              <SelectTrigger className={triggerClass}>
                <SelectValue>{typeLabels[type] ?? type}</SelectValue>
              </SelectTrigger>
              <SelectContent className={contentClass}>
                <SelectItem value="METRIC">Metric</SelectItem>
                <SelectItem value="RULE">Rule</SelectItem>
                <SelectItem value="FILTER">Filter</SelectItem>
                <SelectItem value="FLAG">Flag</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Group">
            <Select
              value={groupId}
              onValueChange={(v) => {
                if (!v) return;
                setGroupId(v);
                setNewGroup("");
              }}
            >
              <SelectTrigger className={triggerClass}>
                <SelectValue placeholder="Select group">
                  {groupId === "__none__"
                    ? "No group"
                    : groups?.find((g: { id: string; name: string }) => g.id === groupId)?.name ??
                      "Select group"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className={contentClass}>
                <SelectItem value="__none__">No group</SelectItem>
                {groups?.map((g: { id: string; name: string }) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="New group">
            <Input
              placeholder="Create a new group instead"
              value={newGroup}
              onChange={(e) => {
                setNewGroup(e.target.value);
                if (e.target.value.trim()) setGroupId("__none__");
              }}
              className={triggerClass}
            />
          </FieldRow>
          <div className="flex items-start gap-4 py-2">
            <label className="w-28 shrink-0 pt-2 text-xs text-[var(--fg-muted)]">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] flex-1 bg-[var(--background,#0d0f14)]"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            className="bg-[var(--accent)] text-black hover:opacity-90"
            disabled={save.isPending || name.trim().length < 2}
            onClick={() => save.mutate()}
          >
            Save changes
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        icon={Trash2}
        iconClassName="bg-red-500/15 text-red-400"
        title="Danger zone"
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-[var(--fg-muted)]">
            Deprecate this definition. It will be hidden from active lists.
          </p>
          <Button
            variant="outline"
            className="shrink-0 border-red-500/40 text-red-400 hover:bg-red-500/10"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete
          </Button>
        </div>
      </SectionCard>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="border-white/10 bg-[var(--surface,#161920)] text-[var(--fg)]">
          <DialogHeader>
            <DialogTitle>Delete “{definition.name}”?</DialogTitle>
            <DialogDescription className="text-[var(--fg-muted)]">
              This deprecates the definition. You can still find it in version history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-500 text-white hover:bg-red-500/90"
              disabled={del.isPending}
              onClick={() => del.mutate()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
