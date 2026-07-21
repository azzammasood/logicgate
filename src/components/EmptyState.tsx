import { Button } from "@/components/ui/button";
import { LogoGlyph } from "@/components/landing/LogoMark";

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
    <div className="lg-fade-up flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--accent)]/15 bg-[var(--accent)]/5">
        <LogoGlyph color="#4ade80" className="h-8 w-8 opacity-60" />
      </div>
      <h3 className="font-[family-name:var(--app-font)] text-lg font-semibold">{v.title}</h3>
      <p className="mt-2 max-w-sm text-sm text-white/50">{v.subtitle}</p>
      {"cta" in v && onCta && (
        <Button className="hover-glow mt-6 bg-[var(--accent)] text-black hover:opacity-90" onClick={onCta}>
          {v.cta}
        </Button>
      )}
    </div>
  );
}
