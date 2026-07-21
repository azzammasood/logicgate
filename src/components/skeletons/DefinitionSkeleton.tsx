import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder shaped like the definition builder (header + section cards). */
function SectionCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[var(--surface,#161920)]/60">
      <div className="flex items-center gap-2.5 border-b border-white/5 px-4 py-3">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-3.5 w-32" />
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-3 w-24 shrink-0" />
            <Skeleton className="h-7 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DefinitionSkeleton() {
  return (
    <div className="space-y-5 px-6 pb-8 pt-6">
      {/* Title + status */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-80" />

      <div className="space-y-5 pt-1">
        <SectionCardSkeleton rows={3} />
        <SectionCardSkeleton rows={4} />
        <SectionCardSkeleton rows={2} />
        <SectionCardSkeleton rows={2} />
      </div>
    </div>
  );
}
