import { Button } from "@/components/ui/button";

const variants = {
  "no-definitions": {
    title: "No definitions yet",
    subtitle: "Create your first metric or business rule to get started.",
    cta: "New Definition",
  },
  "no-changes": {
    title: "No change requests",
    subtitle: "Change requests from stakeholders will appear here.",
  },
  "no-comments": {
    title: "No comments",
    subtitle: "Start a discussion about this definition.",
  },
  "no-history": {
    title: "No version history",
    subtitle: "Changes to definitions will appear in the audit log.",
  },
  "select-definition": {
    title: "Select a definition",
    subtitle: "Choose one from the list or create a new definition with the button on the left.",
  },
} as const;

export function EmptyState({
  variant,
  onCta,
}: {
  variant: keyof typeof variants;
  onCta?: () => void;
}) {
  const v = variants[variant];
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg width="80" height="80" viewBox="0 0 80 80" className="mb-4 text-[#4ade80]/40">
        <rect x="10" y="30" width="20" height="20" fill="currentColor" opacity="0.6" />
        <rect x="50" y="30" width="20" height="20" fill="currentColor" opacity="0.6" />
        <path d="M30 40 L50 40" stroke="currentColor" strokeWidth="2" />
        <circle cx="40" cy="20" r="6" fill="currentColor" />
      </svg>
      <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold">{v.title}</h3>
      <p className="mt-2 max-w-sm text-sm text-white/50">{v.subtitle}</p>
      {"cta" in v && onCta && (
        <Button className="mt-6 bg-[#4ade80] text-black" onClick={onCta}>
          {v.cta}
        </Button>
      )}
    </div>
  );
}
