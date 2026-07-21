"use client";

import { FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/definitions/sections/SectionShell";
import { SectionInfoTip } from "@/components/definitions/sections/SectionInfoTip";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { generateDocumentation } from "@/lib/ai/assist";

type DocumentationSectionProps = {
  value: string;
  onChange: (value: string) => void;
  /** Returns a plain summary of the current definition for AI documentation. */
  buildContext?: () => string;
  defaultCollapsed?: boolean;
};

export function DocumentationSection({
  value,
  onChange,
  buildContext,
  defaultCollapsed,
}: DocumentationSectionProps) {
  return (
    <SectionCard
      icon={FileText}
      defaultCollapsed={defaultCollapsed}
      title="Documentation"
      titleInfo={
        <SectionInfoTip
          description="Explain this definition in plain language. Saved with each published version and shown in the changelog."
          example="Monthly Active Revenue counts distinct users who completed a paid transaction in the calendar month."
        />
      }
      rightLabel={
        buildContext ? (
          <AiAssistButton
            label="Generate with AI"
            loadingLabel="Generating…"
            hideIcon
            onRun={async (cfg) => {
              const summary = buildContext();
              const doc = await generateDocumentation(summary, cfg);
              if (doc) onChange(doc);
            }}
          />
        ) : undefined
      }
    >
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your explanation here…"
        className="min-h-[120px] resize-y bg-[var(--background,#0d0f14)] text-sm"
        rows={5}
      />
    </SectionCard>
  );
}
