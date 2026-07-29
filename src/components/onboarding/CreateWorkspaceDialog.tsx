"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  required?: boolean;
  onCreated: (workspaceId: string) => void;
};

type VerifiedInvite = {
  workspaceId: string;
  workspaceName: string;
  logoUrl: string | null;
  memberCount: number;
  alreadyMember: boolean;
};

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  required,
  onCreated,
}: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [joining, setJoining] = useState(false);
  const [invite, setInvite] = useState<VerifiedInvite | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  /** Accept a full invite URL or a bare code. */
  function parseToken(raw: string) {
    const v = raw.trim();
    if (!v) return "";
    return v.includes("/invite/")
      ? v.split("/invite/")[1]!.split(/[/?#]/)[0]!
      : v.replace(/^\/+|\/+$/g, "");
  }

  const inviteToken = parseToken(inviteLink);

  // Re-typing invalidates a previous check so a stale result can't be joined.
  useEffect(() => {
    setInvite(null);
    setInviteError(null);
  }, [inviteLink]);

  async function verifyInvite() {
    const token = inviteToken;
    if (!token) return;
    setVerifying(true);
    setInviteError(null);
    try {
      const res = await fetch(`/api/invite/${encodeURIComponent(token)}`);
      const json = await res.json();
      if (json.error) {
        setInvite(null);
        setInviteError(json.error);
        return;
      }
      setInvite(json.data as VerifiedInvite);
    } catch {
      setInviteError("Couldn't reach the server. Check your connection.");
    } finally {
      setVerifying(false);
    }
  }

  async function acceptInvite() {
    if (!invite) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/invite/${encodeURIComponent(inviteToken)}`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      await qc.invalidateQueries({ queryKey: ["auth-me"] });
      await qc.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success(
        json.data.alreadyMember
          ? `Switched to ${json.data.workspaceName}`
          : `Joined ${json.data.workspaceName}`
      );
      onCreated(json.data.workspaceId);
      setInviteLink("");
      setInvite(null);
      if (!required) onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't join that organization");
    } finally {
      setJoining(false);
    }
  }

  async function uploadLogo(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/workspaces/logo", { method: "POST", body: form });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setLogoUrl(json.data.logoUrl);
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function createWorkspace(
    wsName: string,
    opts?: { personal?: boolean }
  ) {
    const setBusy = opts?.personal ? setPersonalLoading : setLoading;
    setBusy(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: wsName,
          logoUrl: opts?.personal ? null : logoUrl,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      await qc.invalidateQueries({ queryKey: ["auth-me"] });
      await qc.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success(opts?.personal ? "Personal workspace ready" : "Organization created");
      onCreated(json.data.id);
      setName("");
      setLogoUrl(null);
      if (!required) onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    await createWorkspace(name.trim());
  }

  return (
    <Dialog open={open} onOpenChange={required ? undefined : onOpenChange}>
      <DialogContent
        className="border-white/10 bg-[#161920] sm:max-w-md"
        showCloseButton={!required}
      >
        <DialogHeader>
          <DialogTitle>{required ? "Set up your workspace" : "Add an organization"}</DialogTitle>
          <DialogDescription className="text-white/50">
            {required
              ? "Were you invited to an organization? Paste the invite to join it. Otherwise create one, or continue solo with a personal workspace."
              : "Create a new organization or join one you've been invited to."}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-[#0d0f14] p-1">
          {(["create", "join"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={
                "rounded-md py-1.5 text-xs font-medium transition-colors " +
                (mode === m
                  ? "bg-[var(--accent,#4ade80)]/15 text-[var(--accent,#4ade80)]"
                  : "text-white/50 hover:text-white/80")
              }
            >
              {m === "create" ? "Create new" : "Join existing"}
            </button>
          ))}
        </div>

        {mode === "join" ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs text-white/50">Invite link or code</label>
              <Input
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inviteToken && !invite) {
                    e.preventDefault();
                    void verifyInvite();
                  }
                }}
                placeholder="https://…/invite/abc123 or abc123"
                className="w-full bg-[#0d0f14]"
              />
              <p className="text-[11px] text-white/30">
                Paste the invite your team sent you. We&apos;ll check it before
                you join.
              </p>
            </div>

            {inviteError && (
              <p className="flex items-start gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                <XCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                {inviteError}
              </p>
            )}

            {/* Verified: name the organization before the user commits. */}
            {invite && (
              <div className="rounded-lg border border-[var(--accent,#4ade80)]/25 bg-[var(--accent,#4ade80)]/[0.07] p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--accent,#4ade80)]/15 text-xs font-semibold text-[var(--accent,#4ade80)]">
                    {invite.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={invite.logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      invite.workspaceName.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[11px] text-[var(--accent,#4ade80)]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {invite.alreadyMember ? "You're already a member" : "Valid invite"}
                    </p>
                    <p className="truncate text-sm font-semibold text-white">
                      {invite.workspaceName}
                    </p>
                    <p className="text-[11px] text-white/40">
                      {invite.memberCount} member{invite.memberCount === 1 ? "" : "s"}
                      {!invite.alreadyMember && " · you'll join as a viewer"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {invite ? (
              <Button
                type="button"
                disabled={joining}
                onClick={acceptInvite}
                className="w-full bg-[var(--accent,#4ade80)] text-black"
              >
                {joining
                  ? "Joining…"
                  : invite.alreadyMember
                    ? `Switch to ${invite.workspaceName}`
                    : `Join ${invite.workspaceName}`}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!inviteToken || verifying}
                onClick={verifyInvite}
                className="w-full bg-[var(--accent,#4ade80)] text-black"
              >
                {verifying ? "Checking…" : "Verify invite"}
              </Button>
            )}

            {required && (
              <>
                <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-wider text-white/25">
                  <span className="h-px flex-1 bg-white/10" />
                  or
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={personalLoading || joining}
                  onClick={() => createWorkspace("Personal workspace", { personal: true })}
                  className="w-full border-white/10"
                >
                  {personalLoading ? "Setting up…" : "No invite — continue solo"}
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#0d0f14] text-white/40">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="logo" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
            </div>
            <div className="space-y-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadLogo(file);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/10"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? "Uploading…" : "Browse icon"}
              </Button>
              <p className="text-[10px] text-white/30">Optional · JPEG, PNG, WebP, GIF</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/50">Organization name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Analytics"
              minLength={2}
              className="w-full bg-[#0d0f14]"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || personalLoading || name.trim().length < 2}
            className="w-full bg-[var(--accent,#4ade80)] text-black"
          >
            {loading ? "Creating…" : "Create organization"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-wider text-white/25">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={loading || personalLoading}
          onClick={() => createWorkspace("Personal workspace", { personal: true })}
          className="w-full border-white/10"
        >
          {personalLoading ? "Setting up…" : "Continue with a personal workspace"}
        </Button>
        <p className="mt-2 text-center text-[11px] text-white/30">
          Just for you — record and version your own logics. You can create an
          organization later.
        </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
