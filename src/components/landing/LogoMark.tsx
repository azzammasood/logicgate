import { cn } from "@/lib/utils";

/** Static LogicGate glyph. Place inside a coloured square container. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-5 w-5", className)}
      fill="none"
      aria-hidden
    >
      <rect x="2" y="9" width="6" height="6" rx="1.4" fill="currentColor" />
      <rect x="16" y="9" width="6" height="6" rx="1.4" fill="currentColor" />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="4.5" r="2.4" fill="currentColor" />
      <path d="M12 6.9V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function LogoBadge({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-[var(--accent,#4ade80)] text-[#0a0c10]",
        size === "md" ? "h-9 w-9" : "h-8 w-8",
        className
      )}
    >
      <LogoMark className={size === "md" ? "h-5 w-5" : "h-4 w-4"} />
    </span>
  );
}
