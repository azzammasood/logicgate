export type OpenRouterModel = {
  id: string;
  name: string;
  pricing?: { prompt?: string; completion?: string };
  context_length?: number;
};

/** Curated fast, free models (no credits needed) shown at the top of the picker. */
export const SUGGESTED_FREE_MODELS: { id: string; name: string; note: string }[] = [
  { id: "openrouter/free", name: "Free Models Router", note: "Simplest free inference — auto-selects a model" },
  { id: "deepseek/deepseek-chat-v3-0324:free", name: "DeepSeek V3", note: "Balanced · great at structured output" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", note: "Reliable general model" },
  { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash", note: "Very fast" },
  { id: "qwen/qwen-2.5-72b-instruct:free", name: "Qwen 2.5 72B", note: "Strong reasoning" },
  { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "Mistral Small 3.1", note: "Fast & lightweight" },
];

export function isFreeModel(id: string): boolean {
  return id.endsWith(":free") || id.endsWith("/free");
}

export function shortModelName(id: string): string {
  const suggested = SUGGESTED_FREE_MODELS.find((m) => m.id === id);
  if (suggested) return suggested.name;
  const slug = id.split("/").pop() ?? id;
  return slug.replace(/:free$/, "");
}
