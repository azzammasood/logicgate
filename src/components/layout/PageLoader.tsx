"use client";

import { AnimatedLogo } from "@/components/landing/AnimatedLogo";
import { cn } from "@/lib/utils";

type PageLoaderProps = {
  active?: boolean;
  message?: string;
  className?: string;
};

/** Bottom-right LogicGate loading indicator for page fetches. */
export function PageLoader({ active = false, message = "Loading…", className }: PageLoaderProps) {
  if (!active) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-5 right-5 z-[200] flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface,#161920)]/95 px-4 py-3 shadow-2xl backdrop-blur-sm",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <AnimatedLogo size={44} />
      <div>
        <p className="text-sm font-medium text-[var(--fg)]">{message}</p>
        <p className="text-[11px] text-[var(--fg-muted)]">LogicGate</p>
      </div>
    </div>
  );
}
