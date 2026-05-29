"use client";

import { useEffect } from "react";
import { applyAppearanceToDocument, useAppearanceStore } from "@/stores/appearance";

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const themePreset = useAppearanceStore((s) => s.themePreset);
  const font = useAppearanceStore((s) => s.font);
  const language = useAppearanceStore((s) => s.language);

  useEffect(() => {
    applyAppearanceToDocument(themePreset, font, language);
  }, [themePreset, font, language]);

  return <>{children}</>;
}
