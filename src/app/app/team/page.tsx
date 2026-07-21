"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Copy, Link2, RefreshCw } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};
const roleLabel = (r: string) => ROLE_LABELS[r] ?? r;

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

  // Shareable invite link (managed by workspace owners/admins only).
  const { data: inviteData } = useQuery({
    queryKey: ["invite-code", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite`);
      if (res.status === 403) return { forbidden: true, inviteCode: null as string | null };
      const json = await res.json();
      return { forbidden: false, inviteCode: (json.data?.inviteCode ?? null) as string | null };
    },
    enabled: !!workspaceId,
  });
  const canManage = inviteData ? !inviteData.forbidden : false;
  const inviteCode = inviteData?.inviteCode ?? null;
  const inviteLink =
    inviteCode && typeof window !== "undefined"
      ? `${window.location.origin}/invite/${inviteCode}`
      : "";

  const createLink = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite`, { method: "POST" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data.inviteCode as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invite-code", workspaceId] });
      toast.success("Invite link ready");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeLink = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invite-code", workspaceId] });
      toast.success("Invite link revoked");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex h-full flex-col bg-[#0d0f14]">
      <Topbar title="Stakeholders" />
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
              <SelectValue>{roleLabel(role)}</SelectValue>
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#161920]">
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="EDITOR">Editor</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={inviteMutation.isPending} className="bg-[var(--accent)] text-black">
            Invite
          </Button>
        </form>

        {canManage && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="mb-2 text-xs font-medium text-white/50">
              Or share an invite link
            </p>
            {inviteCode ? (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  readOnly
                  value={inviteLink}
                  onFocus={(e) => e.currentTarget.select()}
                  className="max-w-md bg-[#161920] font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 border-white/10"
                  onClick={() => {
                    void navigator.clipboard?.writeText(inviteLink);
                    toast.success("Invite link copied");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 border-white/10"
                  disabled={createLink.isPending}
                  onClick={() => createLink.mutate()}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  disabled={revokeLink.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Revoke this invite link? Anyone who already has it will no longer be able to join."
                      )
                    ) {
                      revokeLink.mutate();
                    }
                  }}
                >
                  Revoke
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="gap-1.5 border-white/10"
                disabled={createLink.isPending}
                onClick={() => createLink.mutate()}
              >
                <Link2 className="h-3.5 w-3.5" /> Create invite link
              </Button>
            )}
            <p className="mt-2 text-[11px] text-white/35">
              Anyone with this link can join as a Viewer. Regenerate or revoke to
              invalidate old links.
            </p>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#161920] p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && members.length === 0 && (
          <div className="lg-fade-up flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--accent)]/15 bg-[var(--accent)]/5">
              <Users className="h-7 w-7 text-[var(--accent)]/70" />
            </div>
            <h3 className="font-[family-name:var(--app-font)] text-lg font-semibold">
              No stakeholders yet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-white/50">
              Invite teammates by email above to collaborate on definitions and reviews.
            </p>
          </div>
        )}
        <div className="lg-stagger space-y-2">
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
                className="flex items-center justify-between rounded-lg border border-white/10 bg-[#161920] p-4 transition-colors duration-150 hover:border-white/20 hover:bg-[#1a1e29]"
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
                  <Badge className="border-white/10">{roleLabel(m.role)}</Badge>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
