"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useAiStore } from "@/stores/ai";
import { useUiStore } from "@/stores/ui";
import type { AiConfig } from "@/lib/ai/assist";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * A small "do it with AI" button. Handles the API-key check, loading state and
 * error toasts; the caller does the actual work in `onRun` (it receives the
 * current AI config). Only fires on click — never automatically.
 */
export function AiAssistButton({
  label,
  loadingLabel = "Thinking…",
  onRun,
  className,
  hideIcon = false,
}: {
  label: string;
  loadingLabel?: string;
  onRun: (config: AiConfig) => Promise<void>;
  className?: string;
  /** Hide the Sparkles icon (e.g. to avoid repeating the AI mark on a screen). */
  hideIcon?: boolean;
}) {
  const apiKey = useAiStore((s) => s.apiKey);
  const model = useAiStore((s) => s.model);
  const baseUrl = useAiStore((s) => s.baseUrl);
  const webGrounding = useAiStore((s) => s.webGrounding);
  const openPreferences = useUiStore((s) => s.openPreferences);
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (loading) return;
    if (!apiKey.trim() && !baseUrl.trim()) {
      toast.error("Add your OpenRouter API key in Preferences → AI first.");
      openPreferences("ai");
      return;
    }
    setLoading(true);
    try {
      await onRun({ apiKey, model, baseUrl, webGrounding });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/15 disabled:opacity-60",
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>
          {!hideIcon && <Sparkles className="h-3.5 w-3.5" />}
          {label}
        </>
      )}
    </button>
  );
}
