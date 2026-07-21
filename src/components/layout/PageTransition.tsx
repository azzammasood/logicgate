"use client";

import { usePathname } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace";

/**
 * Wraps the active app page and replays a subtle fade/rise animation on
 * meaningful navigation — switching top-level sections (Definitions, Reviews,
 * …) or switching organizations. It intentionally keys on the *section* rather
 * than the full pathname so that drilling into a record (e.g. selecting a
 * definition at /app/definitions/[id]) does NOT remount the section's layout —
 * that keeps list filters/scroll intact and avoids a full re-render.
 */
function sectionKey(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean); // ["app", "definitions", "id"]
  return "/" + parts.slice(0, 2).join("/"); // "/app/definitions"
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);

  return (
    <div
      key={`${workspaceId ?? "none"}:${sectionKey(pathname)}`}
      className="app-page-transition flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      {children}
    </div>
  );
}
