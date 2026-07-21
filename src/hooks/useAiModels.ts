"use client";

import { useQuery } from "@tanstack/react-query";
import { useAiStore } from "@/stores/ai";
import type { OpenRouterModel } from "@/lib/ai/models";

/**
 * Loads the model catalog only when the user has configured AI (an API key or a
 * custom OpenAI-compatible base URL). Without either, we never hit OpenRouter —
 * the picker just shows the suggested models. Cached for an hour and shared, so
 * calling it in the AppShell warms the cache for the Preferences dialog.
 */
export function useAiModels() {
  const apiKey = useAiStore((s) => s.apiKey.trim());
  const baseUrl = useAiStore((s) => s.baseUrl.trim());

  const custom = baseUrl.length > 0;
  const enabled = custom || apiKey.length > 0;
  const base = custom ? baseUrl.replace(/\/+$/, "") : "https://openrouter.ai/api/v1";

  return useQuery({
    queryKey: ["ai-models", custom ? baseUrl : "openrouter", apiKey ? "keyed" : "anon"],
    queryFn: async () => {
      // OpenRouter's /models is public — sending Authorization here only adds a
      // CORS-preflight header that gets rejected. Auth is used only for custom
      // (self-hosted) endpoints that require it.
      const res = await fetch(`${base}/models`, {
        headers: custom && apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      });
      if (!res.ok) return [] as OpenRouterModel[];
      const json = await res.json();
      return (json.data ?? []) as OpenRouterModel[];
    },
    enabled,
    staleTime: 60 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  });
}
