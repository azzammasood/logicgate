"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AnimatedLogo } from "@/components/landing/AnimatedLogo";
import { CreateWorkspaceDialog } from "@/components/onboarding/CreateWorkspaceDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { USER_ROLES, formatUserRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

type Props = {
  /** OAuth sign-ups haven't told us their name/role yet. */
  needsProfile: boolean;
  defaultName: string;
  onWorkspaceReady: (workspaceId: string) => void;
};

/**
 * First-run setup, shown full-page (nothing of the app behind it) until the
 * user has a profile and a workspace: 1) confirm name + role, 2) create,
 * join, or go solo.
 */
export function OnboardingFlow({ needsProfile, defaultName, onWorkspaceReady }: Props) {
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2>(needsProfile ? 1 : 2);
  const [name, setName] = useState(defaultName);
  const [role, setRole] = useState("STAKEHOLDER");
  const [saving, setSaving] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), role }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      // Mirror onto the auth profile so it matches an email sign-up.
      await createClient().auth.updateUser({ data: { name: name.trim(), role } });
      await qc.invalidateQueries({ queryKey: ["auth-me"] });
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your profile");
    } finally {
      setSaving(false);
    }
  }

  const steps = needsProfile ? ["Your profile", "Workspace"] : ["Workspace"];

  return (
    <div className="flex min-h-screen flex-col items-center bg-[var(--background,#0d0f14)] px-4 py-12">
      <AnimatedLogo size={48} />
      <h1 className="mt-5 text-xl font-semibold text-white">Welcome to LogicGate</h1>
      <p className="mt-1 text-sm text-white/50">A couple of quick steps and you&apos;re in.</p>

      {steps.length > 1 && (
        <ol className="mt-6 flex items-center gap-3 text-xs">
          {steps.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <li key={label} className="flex items-center gap-3">
                {i > 0 && <span className="h-px w-8 bg-white/15" />}
                <span
                  className={cn(
                    "flex items-center gap-2",
                    active ? "text-white" : done ? "text-[var(--accent,#4ade80)]" : "text-white/35"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                      active || done
                        ? "border-[var(--accent,#4ade80)] text-[var(--accent,#4ade80)]"
                        : "border-white/20"
                    )}
                  >
                    {done ? "✓" : n}
                  </span>
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="lg-fade-up mt-8 w-full max-w-md">
        {step === 1 ? (
          <form
            onSubmit={saveProfile}
            className="space-y-4 rounded-xl border border-white/10 bg-[#161920] p-6"
          >
            <div>
              <h2 className="text-lg font-semibold text-white">Tell us about you</h2>
              <p className="mt-1 text-sm text-white/50">
                This is how teammates will see you on changes and reviews.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-white/50" htmlFor="onb-name">
                Full name
              </label>
              <Input
                id="onb-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
                className="w-full bg-[#0d0f14]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-white/50">
                What&apos;s your role? We&apos;ll tailor the defaults to it.
              </label>
              <Select value={role} onValueChange={(v) => v && setRole(v)}>
                <SelectTrigger className="w-full bg-[#0d0f14]">
                  <SelectValue placeholder="Role">{formatUserRole(role)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {formatUserRole(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={saving || name.trim().length < 2}
              className="w-full bg-[var(--accent,#4ade80)] text-black"
            >
              {saving ? "Saving…" : "Continue"}
            </Button>
          </form>
        ) : (
          <CreateWorkspaceDialog
            inline
            required
            open
            onOpenChange={() => {}}
            onCreated={onWorkspaceReady}
          />
        )}
      </div>
    </div>
  );
}
