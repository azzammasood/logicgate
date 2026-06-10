"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type SectionInfoTipProps = {
  description: string;
  example?: string;
  className?: string;
};

export function SectionInfoTip({ description, example, className }: SectionInfoTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={cn(
          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[var(--fg-muted)] outline-none transition-colors hover:bg-white/10 hover:text-[var(--fg)]",
          className
        )}
        aria-label="More information"
        onClick={(e) => e.preventDefault()}
      >
        <Info className="h-3.5 w-3.5" />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="max-w-[280px] border border-[var(--border-color)] bg-[var(--surface,#161920)] px-3 py-2 text-left text-xs leading-relaxed text-[var(--fg)] shadow-xl"
      >
        <p className="text-[var(--fg)]/90">{description}</p>
        {example && (
          <p className="mt-2 border-t border-white/10 pt-2 text-[11px] text-[var(--fg-muted)]">
            <span className="font-medium text-[var(--fg)]/70">Example: </span>
            {example}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
