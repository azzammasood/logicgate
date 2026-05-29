"use client";

import { useState } from "react";
import { Palette, Type, Languages } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ThemeSettings,
  FontSettings,
  LanguageSettings,
} from "@/components/settings/AppearanceSettings";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "theme", label: "Theme", icon: Palette },
  { id: "font", label: "Font", icon: Type },
  { id: "language", label: "Language", icon: Languages },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function PreferencesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [section, setSection] = useState<SectionId>("theme");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden border-white/10 bg-[var(--surface,#161920)] p-0 text-[var(--fg)] sm:max-w-2xl">
        <DialogHeader className="border-b border-[var(--border-color)] px-5 py-4">
          <DialogTitle>Preferences</DialogTitle>
        </DialogHeader>
        <div className="flex h-[60vh] min-h-0">
          <nav className="w-44 shrink-0 space-y-1 border-r border-[var(--border-color)] p-3">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    section === s.id
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "text-[var(--fg-muted)] hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {s.label}
                </button>
              );
            })}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {section === "theme" && <ThemeSettings />}
            {section === "font" && <FontSettings />}
            {section === "language" && <LanguageSettings />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
