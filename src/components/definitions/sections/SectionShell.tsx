"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  titleInfo,
  rightLabel,
  children,
  className,
  defaultCollapsed = false,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  titleInfo?: React.ReactNode;
  rightLabel?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Start folded (used for the less-central Ownership / Documentation sections). */
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <section
      className={cn(
        "rounded-xl border border-white/10 bg-[var(--surface,#161920)]/60 transition-colors duration-200 hover:border-white/[0.14]",
        className
      )}
    >
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-white/35 transition-transform duration-200",
              collapsed && "-rotate-90"
            )}
          />
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md",
              // Default to a quiet, monochrome icon so a stack of sections reads
              // as one calm surface rather than a row of rainbow badges.
              iconClassName ?? "bg-white/[0.06] text-white/55"
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-medium text-white/90">{title}</h3>
        </button>
        <div className="flex items-center gap-2 pl-2">
          {titleInfo}
          {rightLabel && <span className="text-xs text-white/35">{rightLabel}</span>}
        </div>
      </header>
      {!collapsed && <div className="p-4">{children}</div>}
    </section>
  );
}

export function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 py-2">
      <label className="w-28 shrink-0 text-xs text-white/50">{label}</label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
