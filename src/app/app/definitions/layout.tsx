"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DefinitionsListPanel } from "@/components/definitions/DefinitionsListPanel";
import { PseudocodeSidebar } from "@/components/definitions/PseudocodeSidebar";
import { DefinitionsTopBar } from "@/components/definitions/DefinitionsTopBar";

export default function DefinitionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Phones show one pane at a time: the list, or the open definition.
  const onDetail = /^\/app\/definitions\/[^/]+/.test(usePathname());

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <DefinitionsTopBar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <DefinitionsListPanel />
        <div
          className={cn(
            "min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--background,#0d0f14)]",
            onDetail ? "flex" : "hidden md:flex"
          )}
        >
          {children}
        </div>
        <PseudocodeSidebar />
      </div>
    </div>
  );
}
