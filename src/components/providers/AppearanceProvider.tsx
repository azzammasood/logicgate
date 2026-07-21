"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { applyAppearanceToDocument, useAppearanceStore } from "@/stores/appearance";

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const themePreset = useAppearanceStore((s) => s.themePreset);
  const font = useAppearanceStore((s) => s.font);
  const language = useAppearanceStore((s) => s.language);
  const pathname = usePathname();
  // The user's theme only applies inside the product (/app). Auth and marketing
  // pages keep the fixed dark LogicGate aesthetic — otherwise a light theme's
  // dark accent lands on their dark backgrounds and buttons go invisible.
  const inApp = pathname?.startsWith("/app") ?? false;

  useEffect(() => {
    applyAppearanceToDocument(inApp ? themePreset : "logicgate", font, language);
  }, [inApp, themePreset, font, language]);

  return <>{children}</>;
}
