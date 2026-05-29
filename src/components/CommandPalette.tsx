"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Command } from "cmdk";
import { FileText, History, GitPullRequest, Settings } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace";
import { cn } from "@/lib/utils";

const pages = [
  { href: "/app/definitions", label: "Definitions", icon: FileText },
  { href: "/app/history", label: "Version History", icon: History },
  { href: "/app/changes", label: "Change Requests", icon: GitPullRequest },
  { href: "/app/settings", label: "Pipeline Config", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);

  const { data: definitions = [] } = useQuery({
    queryKey: ["definitions", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/definitions?workspaceId=${workspaceId}`);
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!workspaceId && open,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setOpen(false)}>
      <Command
        className={cn(
          "absolute left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-white/10 bg-[#161920] shadow-xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Command.Input
          placeholder="Search definitions or pages…"
          className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/40"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-white/40">
            No results.
          </Command.Empty>
          <Command.Group heading="Pages" className="text-xs text-white/40 px-2 py-1">
            {pages.map((p) => {
              const Icon = p.icon;
              return (
                <Command.Item
                  key={p.href}
                  value={p.label}
                  onSelect={() => navigate(p.href)}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-white/80 aria-selected:bg-[#4ade80]/10 aria-selected:text-[#4ade80]"
                >
                  <Icon className="h-4 w-4" />
                  {p.label}
                </Command.Item>
              );
            })}
          </Command.Group>
          <Command.Group heading="Definitions" className="text-xs text-white/40 px-2 py-1">
            {definitions.map((d: { id: string; name: string; type: string }) => (
              <Command.Item
                key={d.id}
                value={`${d.name} ${d.type}`}
                onSelect={() => navigate(`/app/definitions/${d.id}`)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-white/80 aria-selected:bg-[#4ade80]/10 aria-selected:text-[#4ade80]"
              >
                <FileText className="h-4 w-4" />
                {d.name}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
