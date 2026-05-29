"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Settings, User, LogOut } from "lucide-react";
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
import { PreferencesDialog } from "@/components/account/PreferencesDialog";
import { cn } from "@/lib/utils";
import { formatUserLocalTime } from "@/lib/timezones";

export function UserProfileMenu({ collapsed }: { collapsed?: boolean }) {
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "relative z-[60] flex items-center gap-2 rounded-md p-1.5 outline-none hover:bg-white/5",
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
            <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
              <span className="truncate text-sm font-medium text-white/90">
                {shortName || "Account"}
              </span>
              {user?.title && (
                <span className="truncate text-[11px] text-[var(--accent,#4ade80)]">
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
              className="cursor-pointer gap-2"
              onClick={() => setAccountOpen(true)}
            >
              <User className="h-4 w-4" />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => setPrefsOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-red-400 focus:text-red-400"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountSettingsDialog open={accountOpen} onOpenChange={setAccountOpen} user={user} />
      <PreferencesDialog open={prefsOpen} onOpenChange={setPrefsOpen} />
    </>
  );
}
