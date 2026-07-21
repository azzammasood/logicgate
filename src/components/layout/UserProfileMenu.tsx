"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Settings, User, LogOut, MessageSquare, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountSettingsDialog } from "@/components/account/AccountSettingsDialog";
import { FeedbackDialog } from "@/components/account/FeedbackDialog";
import { DocsDialog } from "@/components/account/DocsDialog";
import { NotificationsButton } from "@/components/account/NotificationsButton";
import { useUiStore } from "@/stores/ui";
import { useAiStore } from "@/stores/ai";
import { shortModelName } from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import { formatUserLocalTime } from "@/lib/timezones";

export function UserProfileMenu({ collapsed }: { collapsed?: boolean }) {
  const router = useRouter();
  const openPreferences = useUiStore((s) => s.openPreferences);
  const aiModel = useAiStore((s) => s.model);
  const aiAvailable = useAiStore((s) => s.apiKey.trim().length > 0 || s.baseUrl.trim().length > 0);
  const [accountOpen, setAccountOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [localTime, setLocalTime] = useState("");

  const { data } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      return json.data;
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: false,
  });

  const user = data?.user;
  const initials = user?.avatarInitials ?? "U";
  const shortName = (() => {
    if (!user?.name) return "";
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    return parts[0];
  })();

  useEffect(() => {
    if (!user) return;
    const tick = () => setLocalTime(formatUserLocalTime(user.timezone));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [user]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const aiStatusRow = (
    <button
      type="button"
      onClick={() => openPreferences("ai")}
      title={
        aiAvailable
          ? `AI model: ${aiModel}`
          : "AI not configured — open Preferences → AI"
      }
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] leading-tight outline-none transition-colors hover:bg-white/5",
        aiAvailable ? "text-white/50" : "text-white/30"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          aiAvailable
            ? "lg-pulse-dot bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]"
            : "bg-white/25"
        )}
      />
      <span className="truncate">
        {aiAvailable ? shortModelName(aiModel) : "AI not available"}
      </span>
    </button>
  );

  return (
    <>
      {/* AI model status sits above the separator so it can't crowd the name/title. */}
      {!collapsed && (
        <>
          {aiStatusRow}
          <div className="my-1.5 border-t border-white/10" />
        </>
      )}
      <div className={cn("flex items-center gap-1", collapsed ? "flex-col" : "w-full")}>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "relative z-[60] flex min-w-0 flex-1 items-center gap-2 rounded-md p-1.5 outline-none hover:bg-white/5",
              collapsed ? "mx-auto" : "w-full"
            )}
            title={user?.name ?? "Account"}
          >
            <Avatar className="h-8 w-8 shrink-0 border border-white/10">
              {user?.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-[var(--accent,#4ade80)]/20 text-xs text-[var(--accent,#4ade80)]">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <span className="flex min-w-0 flex-1 flex-col justify-center gap-[3px] text-left">
                <span className="truncate text-sm font-medium leading-tight text-white/90">
                  {shortName || "Account"}
                </span>
                {user?.title && (
                  <span className="truncate text-[11px] leading-tight text-[var(--accent,#4ade80)]">
                    {user.title}
                  </span>
                )}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align={collapsed ? "center" : "start"}
            className="z-[200] w-64 border-white/10 bg-[#161920] p-0"
          >
            {user && (
              <div className="border-b border-white/10 px-3 py-3">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-white/50">{user.email}</p>
                {user.title && (
                  <p className="mt-1 text-xs text-[var(--accent,#4ade80)]">{user.title}</p>
                )}
                {localTime && (
                  <p className="mt-1 text-[10px] text-white/35">{localTime}</p>
                )}
              </div>
            )}
            <div className="p-1">
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-white/90 focus:bg-white/10 focus:text-white data-highlighted:bg-white/10 data-highlighted:text-white"
                onClick={() => setAccountOpen(true)}
              >
                <User className="h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-white/90 focus:bg-white/10 focus:text-white data-highlighted:bg-white/10 data-highlighted:text-white"
                onClick={() => openPreferences("ai")}
              >
                <Settings className="h-4 w-4" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-white/90 focus:bg-white/10 focus:text-white data-highlighted:bg-white/10 data-highlighted:text-white"
                onClick={() => setFeedbackOpen(true)}
              >
                <MessageSquare className="h-4 w-4" />
                Feedback
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-white/90 focus:bg-white/10 focus:text-white data-highlighted:bg-white/10 data-highlighted:text-white"
                onClick={() => setDocsOpen(true)}
              >
                <BookOpen className="h-4 w-4" />
                Docs
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-red-400 focus:bg-red-500/15 focus:text-red-300 data-highlighted:bg-red-500/15 data-highlighted:text-red-300"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationsButton collapsed={collapsed} />
      </div>

      <AccountSettingsDialog open={accountOpen} onOpenChange={setAccountOpen} user={user} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <DocsDialog open={docsOpen} onOpenChange={setDocsOpen} />
    </>
  );
}
