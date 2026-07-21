"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
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

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  required,
  onCreated,
}: Props) {
  const qc = useQueryClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleJoin() {
    const raw = inviteLink.trim();
    if (!raw) return;
    // Accept a full invite URL or a bare token/code.
    const token = raw.includes("/invite/")
      ? raw.split("/invite/")[1]!.split(/[/?#]/)[0]
      : raw.replace(/^\/+|\/+$/g, "");
    if (!token) return;
    router.push(`/invite/${token}`);
  }

  // Prefill from the org name entered during sign-up, if any.
  useEffect(() => {
    if (!open) return;
    try {
      const pending = window.localStorage.getItem("logicgate-pending-org");
      if (pending && pending.trim().length >= 2) setName(pending.trim());
    } catch {
      /* ignore */
    }
  }, [open]);

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
      try {
        window.localStorage.removeItem("logicgate-pending-org");
      } catch {
        /* ignore */
      }
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
          <DialogTitle>Set up your workspace</DialogTitle>
          <DialogDescription className="text-white/50">
            Create a workspace for your organization, join one you were invited
            to, or continue solo with a personal workspace.
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
                placeholder="https://…/invite/abc123 or abc123"
                className="w-full bg-[#0d0f14]"
              />
              <p className="text-[11px] text-white/30">
                Paste the invite your team sent you to join their organization.
              </p>
            </div>
            <Button
              type="button"
              disabled={inviteLink.trim().length === 0}
              onClick={handleJoin}
              className="w-full bg-[var(--accent,#4ade80)] text-black"
            >
              Continue to invite
            </Button>
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
