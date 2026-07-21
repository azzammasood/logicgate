"use client";

import { Zap, X } from "lucide-react";
import { useAiStore } from "@/stores/ai";
import { useUiStore } from "@/stores/ui";

/**
 * Shown at the top of the app when the user hasn't configured an OpenRouter key.
 * Mirrors the nodepad-style enrichment prompt.
 */
export function AiKeyBanner() {
  const apiKey = useAiStore((s) => s.apiKey);
  const baseUrl = useAiStore((s) => s.baseUrl);
  const dismissed = useAiStore((s) => s.bannerDismissed);
  const dismiss = useAiStore((s) => s.dismissBanner);
  const openPreferences = useUiStore((s) => s.openPreferences);

  const available = apiKey.trim().length > 0 || baseUrl.trim().length > 0;
  if (available || dismissed) return null;

  return (
    <div className="flex items-center gap-3 border-b border-amber-500/25 bg-amber-500/[0.08] px-4 py-2 text-xs text-amber-100/90">
      <Zap className="h-4 w-4 shrink-0 text-amber-400" />
      <p className="min-w-0 flex-1 leading-relaxed">
        <span className="font-medium text-amber-200">AI is optional</span>
        {" — "}
        add a free OpenRouter key (no credits needed) to turn plain English into
        definitions. Everything else works without it.
      </p>
      <button
        type="button"
        onClick={() => openPreferences("ai")}
        className="shrink-0 rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-black transition hover:brightness-110"
      >
        Add API key →
      </button>
      <a
        href="https://openrouter.ai/keys"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-[11px] text-amber-200/70 underline underline-offset-2 hover:text-amber-100"
      >
        Get a free key ↗
      </a>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded px-2 py-1 text-[11px] text-amber-200/70 transition-colors hover:bg-amber-500/10 hover:text-amber-100"
      >
        Maybe later
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded p-1 text-amber-200/60 transition-colors hover:bg-amber-500/10 hover:text-amber-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
