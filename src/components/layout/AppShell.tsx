"use client";

import { OrganizationRail } from "@/components/layout/OrganizationRail";
import { Sidebar } from "@/components/layout/Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { NavMobile } from "@/components/layout/NavMobile";
import { ActionOverlay } from "@/components/ActionOverlay";
import { AiKeyBanner } from "@/components/ai/AiKeyBanner";
import { PreferencesDialog } from "@/components/account/PreferencesDialog";
import { useUiStore } from "@/stores/ui";
import { useAiModels } from "@/hooks/useAiModels";

export function AppShell({ children }: { children: React.ReactNode }) {
  const preferencesOpen = useUiStore((s) => s.preferencesOpen);
  const setPreferencesOpen = useUiStore((s) => s.setPreferencesOpen);
  // Warm the model catalog in the background once a key is configured, so the
  // Preferences dialog opens with the full list already loaded.
  useAiModels();
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background,#0d0f14)]">
      <OrganizationRail />
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AiKeyBanner />
        <header className="flex h-12 items-center border-b border-white/10 px-3 md:hidden">
          <Sheet>
            <SheetTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10">
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-white/10 bg-[var(--surface,#161920)] p-0">
              <NavMobile />
            </SheetContent>
          </Sheet>
          <span className="ml-3 font-[family-name:var(--app-font)] text-sm font-bold text-[var(--accent,#4ade80)]">
            LogicGate
          </span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
      <ActionOverlay />
      <PreferencesDialog open={preferencesOpen} onOpenChange={setPreferencesOpen} />
    </div>
  );
}
