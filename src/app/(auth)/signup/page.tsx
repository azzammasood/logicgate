"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspaceStore } from "@/stores/workspace";
import { toast } from "sonner";

const selectContentClass =
  "z-[200] border border-white/10 bg-[#161920] shadow-xl";
const selectTriggerClass = "w-full bg-[#0d0f14] border-white/10";

export default function SignupPage() {
  const router = useRouter();
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [role, setRole] = useState("STAKEHOLDER");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (organizationName.trim().length < 2) {
      toast.error("Organization name must be at least 2 characters");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    await fetch("/api/auth/sync", { method: "POST" });
    const ws = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: organizationName.trim() }),
    });
    const wsData = await ws.json();
    setLoading(false);
    if (wsData.error) {
      toast.error(wsData.error);
      return;
    }
    if (wsData.data?.id) {
      setWorkspace(wsData.data.id);
    }
    toast.success("Welcome to LogicGate");
    router.push("/app/definitions");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background,#0d0f14)] px-4">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[var(--surface,#161920)] p-8">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-[var(--accent,#4ade80)]">
          Create account
        </h1>
        <p className="mt-1 text-sm text-white/50">Set up LogicGate for your team</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            className="bg-[var(--background,#0d0f14)] border-white/10"
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-[var(--background,#0d0f14)] border-white/10"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-[var(--background,#0d0f14)] border-white/10"
          />
          <Input
            placeholder="Organization name *"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
            minLength={2}
            className="bg-[var(--background,#0d0f14)] border-white/10"
          />
          <Select value={role} onValueChange={(v) => v && setRole(v)}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              <SelectItem value="STAKEHOLDER">Stakeholder</SelectItem>
              <SelectItem value="ENGINEER">Engineer</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent,#4ade80)] text-black hover:opacity-90"
          >
            Sign up
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-white/40">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent,#4ade80)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
