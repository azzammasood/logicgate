"use client";

import { useRef, useState } from "react";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), logoUrl }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      await qc.invalidateQueries({ queryKey: ["auth-me"] });
      await qc.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Organization created");
      onCreated(json.data.id);
      setName("");
      setLogoUrl(null);
      if (!required) onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={required ? undefined : onOpenChange}>
      <DialogContent
        className="border-white/10 bg-[#161920] sm:max-w-md"
        showCloseButton={!required}
      >
        <DialogHeader>
          <DialogTitle>Create your organization</DialogTitle>
          <DialogDescription className="text-white/50">
            Organizations hold your definitions, team, and settings. You need one
            before using LogicGate.
          </DialogDescription>
        </DialogHeader>
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
              required
              minLength={2}
              className="w-full bg-[#0d0f14]"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent,#4ade80)] text-black"
          >
            {loading ? "Creating…" : "Create organization"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
