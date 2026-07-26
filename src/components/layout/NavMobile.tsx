"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserProfileMenu } from "@/components/layout/UserProfileMenu";

const items = [
  { href: "/app/dashboard", label: "Overview" },
  { href: "/app/definitions", label: "Definitions" },
  { href: "/app/team", label: "Team" },
  { href: "/app/settings", label: "Settings" },
];

export function NavMobile() {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => (
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
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <UserProfileMenu />
      </div>
    </div>
  );
}
