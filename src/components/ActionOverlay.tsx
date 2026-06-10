"use client";

import { LogoBadge } from "@/components/landing/LogoMark";
import { useActionOverlay } from "@/stores/actionOverlay";

export function ActionOverlay() {
  const active = useActionOverlay((s) => s.active);
  const message = useActionOverlay((s) => s.message);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-end bg-black/30 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface,#161920)] px-4 py-3 shadow-2xl">
        <span className="relative flex items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-lg bg-[var(--accent)]/40" />
          <span className="relative animate-pulse">
            <LogoBadge size="sm" />
          </span>
        </span>
        <div>
          <p className="text-sm font-medium text-[var(--fg)]">{message}</p>
          <p className="text-[11px] text-[var(--fg-muted)]">Please wait…</p>
        </div>
      </div>
    </div>
  );
}
