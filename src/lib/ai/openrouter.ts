const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type OpenRouterOptions = {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  /** OpenAI-compatible base URL (e.g. http://localhost:11434/v1). Empty = OpenRouter. */
  baseUrl?: string;
  /** Enable OpenRouter web-search grounding. */
  webGrounding?: boolean;
  temperature?: number;
  maxTokens?: number;
  /** Ask for a JSON object response where the model supports it. */
  json?: boolean;
  signal?: AbortSignal;
  /** Abort the request after this many ms (default 45s). */
  timeoutMs?: number;
};

/** Pull the assistant text out of an OpenAI-compatible message, tolerating
 * models that return `content` as an array of parts or put their answer in a
 * `reasoning` field with an empty `content`. */
function extractMessageText(message: unknown): string {
  if (!message || typeof message !== "object") return "";
  const m = message as Record<string, unknown>;

  const fromContent = (c: unknown): string => {
    if (typeof c === "string") return c;
    if (Array.isArray(c)) {
      return c
        .map((part) =>
          part && typeof part === "object"
            ? String((part as Record<string, unknown>).text ?? "")
            : ""
        )
        .join("");
    }
    return "";
  };

  const primary = fromContent(m.content).trim();
  if (primary) return primary;

  // Some reasoning-first models leave `content` empty and place text in these.
  const reasoning =
    fromContent(m.reasoning).trim() || fromContent(m.reasoning_content).trim();
  return reasoning;
}

/**
 * Thin, dependency-free chat-completions client. Runs in the browser so the
 * user's key is sent only to their chosen provider — never to our server.
 */
export async function openRouterChat({
  apiKey,
  model,
  messages,
  baseUrl,
  webGrounding = false,
  temperature = 0,
  maxTokens = 800,
  json = false,
  signal,
  timeoutMs = 45_000,
}: OpenRouterOptions): Promise<string> {
  const base = (baseUrl?.trim() || OPENROUTER_BASE).replace(/\/+$/, "");
  const isOpenRouter = base === OPENROUTER_BASE;

  // Abort the request if the provider goes silent, and chain any caller signal.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let res: Response;
  try {
    // NOTE: we intentionally send only the minimal headers. Custom headers like
    // HTTP-Referer / X-Title add entries to the CORS preflight that OpenRouter
    // rejects for browser origins, which silently kills the request.
    res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(json ? { response_format: { type: "json_object" } } : {}),
        ...(isOpenRouter && webGrounding ? { plugins: [{ id: "web" }] } : {}),
      }),
      signal: controller.signal,
    });
  } catch (e) {
    // Timeout (our abort) vs. a genuine network/CORS/CSP failure.
    if (controller.signal.aborted && !signal?.aborted) {
      throw new Error(
        "The AI request timed out — the provider may be busy or unreachable. Try again or pick another model."
      );
    }
    if (signal?.aborted) throw e; // caller cancelled — propagate as-is
    throw new Error(
      `Couldn't reach the AI provider${
        isOpenRouter ? "" : ` at ${base}`
      }. Check your connection${
        isOpenRouter ? "" : " and that the local/custom endpoint is running"
      }, then try again.`
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = err?.error?.message ?? err?.message ?? "";
    } catch {
      /* ignore */
    }
    if (res.status === 401) throw new Error("Invalid or missing OpenRouter API key.");
    if (res.status === 402) throw new Error("This model needs credits. Pick a free model instead.");
    if (res.status === 429) throw new Error("Rate limited by OpenRouter — try again shortly.");
    if (res.status >= 500)
      throw new Error("The AI provider is having trouble (server error). Try again shortly.");
    throw new Error(detail || `OpenRouter request failed (${res.status}).`);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error("The AI provider returned an unreadable response. Try again.");
  }

  const choice = (data as { choices?: Array<Record<string, unknown>> })?.choices?.[0];
  const content = extractMessageText(choice?.message);
  if (!content) {
    // A provider-level error can still arrive with HTTP 200.
    const providerErr = (data as { error?: { message?: string } })?.error?.message;
    if (providerErr) throw new Error(providerErr);
    if (choice?.finish_reason === "length") {
      throw new Error(
        "The model ran out of tokens before answering. Try a different model or a simpler request."
      );
    }
    throw new Error(
      "The model returned an empty response. This free model may be overloaded — try again or pick another model in Preferences → AI."
    );
  }
  return content;
}

/** Best-effort JSON.parse that also strips trailing commas. */
function tryParse(raw: string): unknown | undefined {
  const cleaned = raw.replace(/,(\s*[}\]])/g, "$1"); // tolerate trailing commas
  try {
    return JSON.parse(cleaned);
  } catch {
    return undefined;
  }
}

/**
 * Extract the first JSON object from a model response. Handles ```json fences,
 * reasoning tags (<think>…</think>), surrounding prose, trailing commas, and
 * unbalanced trailing text by matching balanced braces.
 */
export function extractJson(text: string): unknown {
  let s = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
    .trim();

  let r = tryParse(s);
  if (r !== undefined) return r;

  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    r = tryParse(fenced[1].trim());
    if (r !== undefined) return r;
  }

  const start = s.indexOf("{");
  if (start !== -1) {
    // Walk balanced braces from the first "{".
    let depth = 0;
    for (let i = start; i < s.length; i++) {
      const ch = s[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          r = tryParse(s.slice(start, i + 1));
          if (r !== undefined) return r;
          break;
        }
      }
    }
    // Last resort: first "{" to last "}".
    const end = s.lastIndexOf("}");
    if (end > start) {
      r = tryParse(s.slice(start, end + 1));
      if (r !== undefined) return r;
    }
  }

  throw new Error("Could not parse a structured result from the model.");
}
