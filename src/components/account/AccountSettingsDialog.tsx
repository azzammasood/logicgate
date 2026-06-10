"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { COMMON_TIMEZONES, TIMEZONE_LABELS } from "@/lib/timezones";
import { USER_ROLES, formatUserRole } from "@/lib/roles";

const selectContentClass =
  "z-[200] border border-white/10 bg-[#161920] shadow-xl";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  title?: string | null;
  timezone?: string | null;
  about?: string | null;
  avatarInitials: string;
  avatarUrl?: string | null;
};

export function AccountSettingsDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("STAKEHOLDER");
  const [title, setTitle] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [about, setAbout] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role);
      setTitle(user.title ?? "");
      setTimezone(user.timezone ?? "UTC");
      setAbout(user.about ?? "");
      setAvatarPreview(user.avatarUrl ?? null);
    }
  }, [user, open]);

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/users/me/avatar", { method: "POST", body: form });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setAvatarPreview(json.data.avatarUrl);
      await qc.invalidateQueries({ queryKey: ["auth-me"] });
      toast.success("Photo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          title: title.trim() || null,
          timezone,
          about: about.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth-me"] });
      toast.success("Profile updated");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border-white/10 bg-[#161920] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Account</DialogTitle>
          </DialogHeader>
          <p className="py-8 text-center text-sm text-white/50">Loading your account…</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#161920] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border border-white/10">
              {avatarPreview ? <AvatarImage src={avatarPreview} alt={name} /> : null}
              <AvatarFallback className="text-lg bg-[var(--accent,#4ade80)]/20 text-[var(--accent,#4ade80)]">
                {user.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadAvatar(file);
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
                {uploading ? "Uploading…" : "Browse photo"}
              </Button>
              <p className="text-[10px] text-white/30">JPEG, PNG, WebP or GIF · max 2 MB</p>
            </div>
          </div>

          <p className="text-xs text-white/40">{user.email}</p>

          <div className="space-y-2">
            <label className="text-xs text-white/50">Display name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-[#0d0f14]" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/50">Role</label>
            <Select value={role} onValueChange={(v) => v && setRole(v)}>
              <SelectTrigger className="w-full bg-[#0d0f14]">
                <SelectValue placeholder="Role">{formatUserRole(role)}</SelectValue>
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {formatUserRole(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/50">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Data Engineer"
              className="bg-[#0d0f14]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/50">Timezone</label>
            <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
              <SelectTrigger className="w-full bg-[#0d0f14]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {TIMEZONE_LABELS[tz] ?? tz.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/50">About me</label>
            <Textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="A short bio for your team…"
              className="min-h-[100px] bg-[#0d0f14]"
            />
          </div>

          <Button
            className="w-full bg-[var(--accent,#4ade80)] text-black"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
