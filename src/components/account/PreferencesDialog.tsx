"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeSettings, FontSettings } from "@/components/settings/AppearanceSettings";
import { AiSettingsSection } from "@/components/account/AiSettingsSection";
import { useUiStore } from "@/stores/ui";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "ai", label: "AI", desc: "OpenRouter key & model" },
  { id: "appearance", label: "Appearance", desc: "Theme & font" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function PreferencesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [section, setSection] = useState<SectionId>("ai");
  const requestedSection = useUiStore((s) => s.preferencesSection);

  // When the dialog is opened, jump to the section the opener asked for
  // (e.g. the sidebar model row wants AI, not whatever was last viewed).
  useEffect(() => {
    if (open) setSection(requestedSection);
  }, [open, requestedSection]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden border-white/10 bg-[var(--surface,#161920)] p-0 text-[var(--fg)] sm:max-w-2xl">
        <DialogHeader className="border-b border-[var(--border-color)] px-5 py-4">
          <DialogTitle>Preferences</DialogTitle>
        </DialogHeader>
        <div className="flex h-[62vh] min-h-0">
          <nav className="w-48 shrink-0 space-y-1 border-r border-[var(--border-color)] p-3">
            {SECTIONS.map((s) => {
              const active = section === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className={cn(
                    "flex w-full flex-col rounded-md px-3 py-2 text-left transition-colors",
                    active
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "text-[var(--fg-muted)] hover:bg-white/5"
                  )}
                >
                  <span className="text-sm font-medium leading-tight">{s.label}</span>
                  <span
                    className={cn(
                      "truncate text-[11px] leading-tight",
                      active ? "text-[var(--accent)]/70" : "text-white/30"
                    )}
                  >
                    {s.desc}
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {section === "ai" && <AiSettingsSection />}
            {section === "appearance" && (
              <div className="space-y-8">
                <ThemeSettings />
                <FontSettings />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
