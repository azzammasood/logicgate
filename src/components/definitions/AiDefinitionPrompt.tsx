"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useAiStore } from "@/stores/ai";
import { useUiStore } from "@/stores/ui";
import { parseDefinition, type AiParseResult } from "@/lib/ai/parseDefinition";
import { toast } from "sonner";

export type { AiParseResult };

const EXAMPLES = [
  "Active users are people who logged in at least once in the last 30 days and are not on a trial plan.",
  "Monthly revenue is the sum of completed transactions excluding refunds and chargebacks.",
  "High-value customers have spent more than 10,000 USD in total and are not internal accounts.",
  "Churned accounts are those with no activity in the last 90 days and a cancelled subscription.",
  "Failed payments are transactions where the status is failed and the amount is greater than zero.",
  "New signups are users created in the last 7 days who have verified their email.",
  "Enterprise deals are opportunities with a value over 50,000 and a plan type of enterprise.",
  "Engaged users have opened the app at least 5 times in the past week.",
  "Refund rate counts transactions of type refund grouped by month.",
  "At-risk accounts have a health score below 40 and a renewal date within 30 days.",
];

export function AiDefinitionPrompt({
  onApply,
  onGeneratingChange,
}: {
  onApply: (r: AiParseResult) => void;
  onGeneratingChange?: (generating: boolean) => void;
}) {
  const apiKey = useAiStore((s) => s.apiKey);
  const model = useAiStore((s) => s.model);
  const baseUrl = useAiStore((s) => s.baseUrl);
  const webGrounding = useAiStore((s) => s.webGrounding);
  const openPreferences = useUiStore((s) => s.openPreferences);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, []);

  const available = apiKey.trim().length > 0 || baseUrl.trim().length > 0;

  function typeExample() {
    if (typingRef.current) clearInterval(typingRef.current);
    const example = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]!;
    setText("");
    setTyping(true);
    let i = 0;
    typingRef.current = setInterval(() => {
      i += 1;
      setText(example.slice(0, i));
      if (i >= example.length) {
        if (typingRef.current) clearInterval(typingRef.current);
        typingRef.current = null;
        setTyping(false);
      }
    }, 16);
  }

  async function handleGenerate() {
    const value = text.trim();
    if (!value || loading || typing) return;
    if (!available) {
      toast.error("Add your OpenRouter API key in Preferences → AI first.");
      openPreferences("ai");
      return;
    }
    setLoading(true);
    onGeneratingChange?.(true);
    try {
      const result = await parseDefinition({ text: value, apiKey, model, baseUrl, webGrounding });
      onApply(result);
      toast.success(
        result.conditions.length > 0
          ? `Added ${result.conditions.length} condition${
              result.conditions.length === 1 ? "" : "s"
            } from your description.`
          : "Filled from your description."
      );
      setText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed. Try again.");
    } finally {
      setLoading(false);
      onGeneratingChange?.(false);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--accent)]/25 bg-gradient-to-br from-[var(--accent)]/[0.06] to-transparent p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)]/15 text-[var(--accent)]">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-sm font-medium text-white/90">Describe it in plain English</h3>
        {!available && (
          <button
            type="button"
            onClick={() => openPreferences("ai")}
            className="ml-auto text-[11px] text-[var(--accent)] hover:underline"
          >
            Add API key →
          </button>
        )}
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleGenerate();
            }
          }}
          rows={2}
          placeholder="e.g. Active users logged in within the last 30 days and are not on a trial plan"
          className="w-full resize-y rounded-lg border border-white/10 bg-[var(--background,#0d0f14)] px-3 py-2 text-sm text-white/90 outline-none transition-colors placeholder:text-white/30 focus:border-[var(--accent)]/40"
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || typing || !text.trim()}
          className="hover-glow inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Generate conditions"
          )}
        </button>
        {!text && !typing && (
          <button
            type="button"
            onClick={typeExample}
            className="ml-auto inline-flex items-center gap-1 text-[11px] text-white/40 transition-colors hover:text-white/70"
          >
            Try an example <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </section>
  );
}
