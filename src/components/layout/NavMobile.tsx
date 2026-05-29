"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserProfileMenu } from "@/components/layout/UserProfileMenu";

const items = [
  { href: "/app/definitions", label: "Definitions", icon: FileText },
  { href: "/app/team", label: "Team", icon: Users },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function NavMobile() {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                pathname.startsWith(item.href)
                  ? "bg-[var(--accent,#4ade80)]/10 text-[var(--accent,#4ade80)]"
                  : "text-white/60"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <UserProfileMenu />
      </div>
    </div>
  );
}
