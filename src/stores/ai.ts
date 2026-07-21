import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Default free model — OpenRouter's free router, no credits required. */
export const DEFAULT_MODEL = "openrouter/free";

interface AiState {
  apiKey: string;
  model: string;
  /** Optional OpenAI-compatible base URL (Ollama, LM Studio, vLLM, …). Empty = OpenRouter. */
  baseUrl: string;
  /** Enable OpenRouter web-search grounding (only meaningful on OpenRouter). */
  webGrounding: boolean;
  bannerDismissed: boolean;
  setApiKey: (apiKey: string) => void;
  setModel: (model: string) => void;
  setBaseUrl: (baseUrl: string) => void;
  setWebGrounding: (webGrounding: boolean) => void;
  dismissBanner: () => void;
  resetBanner: () => void;
}

export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      apiKey: "",
      model: DEFAULT_MODEL,
      baseUrl: "",
      webGrounding: false,
      bannerDismissed: false,
      setApiKey: (apiKey) => set({ apiKey, bannerDismissed: false }),
      setModel: (model) => set({ model }),
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      setWebGrounding: (webGrounding) => set({ webGrounding }),
      dismissBanner: () => set({ bannerDismissed: true }),
      resetBanner: () => set({ bannerDismissed: false }),
    }),
    {
      name: "logicgate-ai",
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as Partial<AiState> | undefined;
        // v1: switch the old default free model to the Free Models Router.
        if (state && version < 1 && state.model === "deepseek/deepseek-chat-v3-0324:free") {
          state.model = DEFAULT_MODEL;
        }
        return state as AiState;
      },
    }
  )
);
