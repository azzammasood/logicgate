"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { PageLoader } from "@/components/layout/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceStore } from "@/stores/workspace";
import { toast } from "sonner";

export default function TeamPage() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("VIEWER");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!workspaceId,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      setEmail("");
      qc.invalidateQueries({ queryKey: ["members", workspaceId] });
      toast.success("Member invited");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex h-full flex-col bg-[#0d0f14]">
      <Topbar title="Stakeholders" />
      <PageLoader active={isLoading} message="Loading stakeholders…" />
      <div className="border-b border-white/10 p-6">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            inviteMutation.mutate();
          }}
        >
          <Input
            type="email"
            placeholder="email@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="max-w-xs bg-[#161920]"
            required
          />
          <Select value={role} onValueChange={(v) => v && setRole(v)}>
            <SelectTrigger className="w-32 bg-[#161920]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="EDITOR">Editor</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={inviteMutation.isPending} className="bg-[#4ade80] text-black">
            Invite
          </Button>
        </form>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-2">
          {members.map(
            (m: {
              id: string;
              role: string;
              user: {
                name: string;
                email: string;
                avatarInitials: string;
                _count?: { ownedDefinitions: number };
              };
            }) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-[#161920] p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="flex items-center justify-center bg-[var(--accent)]/15 text-xs font-semibold leading-none text-[var(--accent)]">
                      {m.user.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{m.user.name}</p>
                    <p className="text-sm text-white/50">{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">
                    {m.user._count?.ownedDefinitions ?? 0} definitions
                  </span>
                  <Badge className="border-white/10">{m.role}</Badge>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
