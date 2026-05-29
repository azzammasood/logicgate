import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  rightLabel,
  children,
  className,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  rightLabel?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-white/10 bg-[var(--surface,#161920)]/60",
        className
      )}
    >
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md",
              iconClassName ?? "bg-[var(--accent,#4ade80)]/15 text-[var(--accent,#4ade80)]"
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-medium text-white/90">{title}</h3>
        </div>
        {rightLabel && (
          <span className="text-xs text-white/35">{rightLabel}</span>
        )}
      </header>
      <div className="p-4">{children}</div>
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
