"use client";

import { FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/definitions/sections/SectionShell";
import { SectionInfoTip } from "@/components/definitions/sections/SectionInfoTip";

type DocumentationSectionProps = {
  value: string;
  onChange: (value: string) => void;
};

export function DocumentationSection({ value, onChange }: DocumentationSectionProps) {
  return (
    <SectionCard
      icon={FileText}
      iconClassName="bg-[var(--accent)]/15 text-[var(--accent)]"
      title="Documentation"
      titleInfo={
        <SectionInfoTip
          description="Explain this definition in plain language. Saved with each published version and shown in the changelog."
          example="Monthly Active Revenue counts distinct users who completed a paid transaction in the calendar month."
        />
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
