"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  History,
  GitPullRequest,
  Download,
  CheckCircle,
  MessageSquare,
  Users,
  SlidersHorizontal,
  Plug,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui";
import { useWorkspaceStore } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import { LogoBadge } from "@/components/landing/LogoMark";
import { UserProfileMenu } from "@/components/layout/UserProfileMenu";

type BadgeKey = "definitions" | "changes" | "approvals";

type NavItem = {
  href: string;
  label: string;
  icon: typeof FileText;
  badgeKey?: BadgeKey;
  badgeTone?: "muted" | "amber";
};

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Workspace",
    items: [
      { href: "/app/definitions", label: "Definitions", icon: FileText, badgeKey: "definitions", badgeTone: "muted" },
      { href: "/app/history", label: "Version History", icon: History },
      { href: "/app/changes", label: "Change Requests", icon: GitPullRequest, badgeKey: "changes", badgeTone: "amber" },
      { href: "/app/export", label: "Pseudocode Export", icon: Download },
    ],
  },
  {
    title: "Review",
    items: [
      { href: "/app/approvals", label: "Approvals", icon: CheckCircle, badgeKey: "approvals", badgeTone: "amber" },
      { href: "/app/discussions", label: "Discussions", icon: MessageSquare },
      { href: "/app/team", label: "Stakeholders", icon: Users },
    ],
  },
    {
    title: "Settings",
    items: [
      { href: "/app/settings", label: "Pipeline Config", icon: SlidersHorizontal },
      { href: "/app/settings/integrations", label: "Integrations", icon: Plug },
    ],
  },
];

const ALL_PATHS = navSections.flatMap((s) => s.items.map((i) => i.href.split("?")[0]));

function isActivePath(pathname: string, itemPath: string) {
  const matches = ALL_PATHS.filter(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (matches.length === 0) return false;
  // Only the most specific (longest) matching path wins.
  const best = matches.reduce((a, b) => (b.length > a.length ? b : a));
  return best === itemPath;
}

function NavContent({
  collapsed,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);

  const { data: definitionsData } = useQuery({
    queryKey: ["definitions", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await fetch(`/api/definitions?workspaceId=${workspaceId}`);
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!workspaceId,
  });

  const { data: changesData } = useQuery({
    queryKey: ["change-requests", workspaceId, "PENDING"],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await fetch(
        `/api/change-requests?workspaceId=${workspaceId}&status=PENDING`
      );
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!workspaceId,
    refetchInterval: 60_000,
  });

  const badges: Record<BadgeKey, number> = {
    definitions: definitionsData?.length ?? 0,
    changes: changesData?.length ?? 0,
    approvals: changesData?.length ?? 0,
  };

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
      <div className="flex items-center gap-2 px-1">
        <LogoBadge />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate font-[family-name:var(--font-syne)] text-sm font-bold leading-tight text-white">
              LogicGate
            </p>
            <p className="truncate text-[10px] text-white/40">Data Definition Layer</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-white/40 hover:text-white"
          onClick={onToggleCollapse}
          title="Toggle sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>

      {navSections.map((section) => (
        <div key={section.title} className="space-y-1">
          {!collapsed && (
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              {section.title}
            </p>
          )}
          {section.items.map((item) => {
            const Icon = item.icon;
            const itemPath = item.href.split("?")[0];
            const active = isActivePath(pathname, itemPath);
            const count = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-[var(--accent,#4ade80)]/10 text-[var(--accent,#4ade80)]"
                    : "text-white/60 hover:bg-white/5 hover:text-white",
                  collapsed && "justify-center"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-[var(--accent,#4ade80)]" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {!collapsed && count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                      item.badgeTone === "amber"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-white/10 text-white/50"
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col border-r border-white/10 bg-[var(--surface,#161920)] md:flex",
        sidebarOpen ? "w-60" : "w-[4.5rem]"
      )}
    >
      <NavContent
        collapsed={!sidebarOpen}
        onToggleCollapse={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="relative z-[60] mt-auto border-t border-white/10 p-2">
        <UserProfileMenu collapsed={!sidebarOpen} />
      </div>
    </aside>
  );
}
