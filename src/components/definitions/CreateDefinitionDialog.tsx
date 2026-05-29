"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

const selectContentClass =
  "z-[200] max-h-60 w-[var(--anchor-width)] border border-white/10 bg-[#161920] text-white shadow-xl";
const selectTriggerClass = "w-full bg-[var(--background,#0d0f14)]";

const GROUP_COLORS = ["#4ade80", "#60a5fa", "#a78bfa", "#fbbf24", "#f87171", "#22d3ee"];

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

  const { data: groups } = useQuery({
    queryKey: ["groups", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/groups?workspaceId=${workspaceId}`);
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!workspaceId && open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId) {
        throw new Error("Select an organization first (left panel).");
      }

      let resolvedGroupId: string | null = groupId || null;
      const trimmedNew = newGroupName.trim();

      if (trimmedNew) {
        const groupRes = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedNew,
            workspaceId,
            color: GROUP_COLORS[(groups?.length ?? 0) % GROUP_COLORS.length],
          }),
        });
        const groupJson = await groupRes.json();
        if (groupJson.error) throw new Error(groupJson.error);
        resolvedGroupId = groupJson.data.id;
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
          <Select value={type} onValueChange={(v) => v && setType(v)}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              <SelectItem value="METRIC">Metric</SelectItem>
              <SelectItem value="RULE">Rule</SelectItem>
              <SelectItem value="FILTER">Filter</SelectItem>
              <SelectItem value="FLAG">Flag</SelectItem>
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <label className="text-xs text-white/50">Group</label>
            <Select
              value={groupId || "__none__"}
              onValueChange={(v) => {
                if (v === "__none__") setGroupId("");
                else setGroupId(v ?? "");
                setNewGroupName("");
              }}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                <SelectItem value="__none__">No group</SelectItem>
                {groups?.map((g: { id: string; name: string }) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Or create new group (e.g. Revenue)"
              value={newGroupName}
              onChange={(e) => {
                setNewGroupName(e.target.value);
                if (e.target.value.trim()) setGroupId("");
              }}
              className="bg-[var(--background,#0d0f14)]"
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
