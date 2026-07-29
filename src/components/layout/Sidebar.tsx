"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FileText,
  GitPullRequest,
  Code2,
  MessageSquare,
  Users,
  SlidersHorizontal,
  Plug,
  PanelLeft,
  Search,
} from "lucide-react";
import { OPEN_PALETTE_EVENT } from "@/components/CommandPalette";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui";
import { useWorkspaceStore } from "@/stores/workspace";
import { Button } from "@/components/ui/button";
import { LogoBadge } from "@/components/landing/LogoMark";
import { UserProfileMenu } from "@/components/layout/UserProfileMenu";

type BadgeKey = "definitions" | "reviews";

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
      { href: "/app/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/app/definitions", label: "Definitions", icon: FileText, badgeKey: "definitions", badgeTone: "muted" },
      { href: "/app/changes", label: "Reviews", icon: GitPullRequest, badgeKey: "reviews", badgeTone: "amber" },
      { href: "/app/pseudocodes", label: "Pseudocodes", icon: Code2 },
    ],
  },
  {
    title: "Collaboration",
    items: [
      { href: "/app/discussions", label: "Discussions", icon: MessageSquare },
      { href: "/app/team", label: "Stakeholders", icon: Users },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/app/settings", label: "Configuration", icon: SlidersHorizontal },
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

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/sync", { method: "POST" });
      const json = await res.json();
      return json.data as { id: string } | null;
    },
  });

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

  const { data: myPendingReviews } = useQuery({
    queryKey: ["change-requests", workspaceId, "PENDING", "mine", currentUser?.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/change-requests?workspaceId=${workspaceId}&status=PENDING&approverId=${currentUser!.id}`
      );
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!workspaceId && !!currentUser?.id,
    refetchInterval: 60_000,
  });

  const badges: Record<BadgeKey, number> = {
    definitions: definitionsData?.length ?? 0,
    reviews: myPendingReviews?.length ?? 0,
  };

  return (
    <nav className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
      <div
        className={cn(
          "flex shrink-0 items-center gap-2.5 border-b border-white/10 px-[18px] pb-4 pt-5",
          collapsed && "flex-col justify-center px-0"
        )}
      >
        <LogoBadge animateOnHover href="/app/definitions" />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate font-[family-name:var(--font-display)] text-base font-extrabold leading-tight tracking-[-0.3px] text-white">
              LogicGate
            </p>
            <p className="text-[11px] leading-snug tracking-[0.5px] text-white/35">
              Data Definition Layer
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-white/40 hover:text-white"
          onClick={onToggleCollapse}
          title="Toggle sidebar"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>

      {navSections.map((section) => (
        <div key={section.title} className="border-b border-white/10 py-2">
          {!collapsed && (
            <p className="px-[18px] pb-1 pt-2 text-[10px] uppercase tracking-[1.5px] text-white/30">
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
                  "flex items-center gap-2.5 border-l-2 py-[7px] text-sm transition-colors",
                  active
                    ? "border-l-[var(--accent,#4ade80)] bg-[var(--accent-dim)] text-[var(--accent,#4ade80)]"
                    : "border-l-transparent text-white/60 hover:bg-[var(--accent-dim2)] hover:text-white",
                  // Expanded rows sit indented under their section heading.
                  collapsed ? "justify-center px-2" : "pl-[30px] pr-[18px]"
                )}
              >
                {/* Icons only in the collapsed rail; the expanded menu is text-only. */}
                {collapsed && <Icon className="h-3.5 w-3.5 shrink-0" />}
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {!collapsed && count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-[6px] py-px text-[11px]",
                      // Active row badge is green (mockup .badge.new); the rest
                      // are quiet grey pills (mockup .badge).
                      active
                        ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                        : "bg-[var(--surface3)] text-[var(--text3)]"
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

      {/* Command palette hint — the shortcut is otherwise undiscoverable. */}
      {!collapsed && (
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
          className="mx-[18px] mb-3 mt-auto flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[var(--background,#0d0f14)] px-3 py-2.5 text-left transition-colors hover:border-white/20 hover:bg-white/5"
        >
          <span className="flex items-center gap-2 text-[13px] text-white/55">
            <Search className="h-4 w-4 shrink-0" />
            Search &amp; commands
          </span>
          <kbd className="shrink-0 rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-[family-name:var(--app-font)] text-[11px] text-white/60">
            Ctrl K
          </kbd>
        </button>
      )}
    </nav>
  );
}

export function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col overflow-x-hidden border-r border-white/10 bg-[var(--surface,#161920)] transition-[width] duration-300 ease-in-out md:flex",
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
