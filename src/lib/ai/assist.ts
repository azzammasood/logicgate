import { openRouterChat } from "@/lib/ai/openrouter";

export type AiConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  webGrounding?: boolean;
};

const OP_LABEL: Record<string, string> = {
  EQUALS: "=",
  NOT_EQUALS: "!=",
  IN: "in",
  NOT_IN: "not in",
  GREATER_THAN: ">",
  LESS_THAN: "<",
  GREATER_EQUAL: ">=",
  LESS_EQUAL: "<=",
  IS_NULL: "is null",
  IS_NOT_NULL: "is not null",
  CONTAINS: "contains",
  STARTS_WITH: "starts with",
};

type Cond = {
  connector?: string;
  field?: string;
  operator?: string;
  value?: string | null;
};

export function summarizeConditions(conds: Cond[]): string {
  return conds
    .map((c) => `${c.connector ?? ""} ${c.field ?? ""} ${OP_LABEL[c.operator ?? ""] ?? c.operator ?? ""} ${c.value ?? ""}`.trim())
    .join(" ");
}

export function summarizeDefinition(def: Record<string, unknown>, conds: Cond[]): string {
  const parts: string[] = [];
  const s = (k: string) => (def[k] == null || def[k] === "" ? null : String(def[k]));
  if (s("name")) parts.push(`Name: ${s("name")}`);
  if (s("type")) parts.push(`Type: ${s("type")}`);
  if (s("sourceTable")) parts.push(`Source table: ${s("sourceTable")}`);
  if (s("sourceValueField")) parts.push(`Value field: ${s("sourceValueField")}`);
  parts.push(conds?.length ? `Conditions: ${summarizeConditions(conds)}` : "Conditions: none");
  if (s("aggregationFn")) {
    const vf = s("sourceValueField");
    const gb = s("groupByPeriod");
    parts.push(`Aggregation: ${s("aggregationFn")}${vf ? `(${vf})` : ""}${gb ? ` grouped by ${gb}` : ""}`);
  }
  if (s("dedupeBy")) parts.push(`Dedupe by ${s("dedupeBy")}${s("dedupeStrategy") ? ` (${s("dedupeStrategy")})` : ""}`);
  return parts.join(". ");
}

/** Generic plain-text completion, cleaned of quotes/reasoning tags. */
export async function aiComplete({
  apiKey,
  model,
  baseUrl,
  webGrounding,
  system,
  user,
  maxTokens = 200,
  temperature = 0.3,
}: AiConfig & {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const raw = await openRouterChat({
    apiKey: apiKey.trim(),
    model: model.trim(),
    baseUrl,
    webGrounding,
    temperature,
    maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim()
    .replace(/^["'“”]|["'“”]$/g, "")
    .trim();
}

const REASON_PROMPT = `You write concise, professional change reasons for a data-definition audit log. Given the PREVIOUS and CURRENT definition (or a single definition), reply with ONE sentence, max 22 words, explaining what changed and why it matters to the metric. Be specific about the fields/conditions involved. Output only the sentence — no quotes, no "Reason:" prefix.`;

const DOC_PROMPT = `You explain a data definition in plain English for a non-technical stakeholder. Begin the very first sentence with the definition's exact name (from the "Name:" field) as the grammatical subject — e.g. "Locked Users Revenue pulls all rows from …". Then, in 2 to 4 clear sentences total, describe which records it selects, what it excludes, and how the values are aggregated. No preamble, no markdown, no bullet points, no quotes.`;

/**
 * Suggests a change reason by diffing the definition's current state against its
 * last published version (fetched client-side). User-initiated only.
 */
export async function suggestChangeReason(
  definitionId: string,
  config: AiConfig
): Promise<string> {
  const defRes = await fetch(`/api/definitions/${definitionId}`);
  const def = (await defRes.json())?.data ?? {};
  const afterSummary = summarizeDefinition(def, def.conditions ?? []);

  let before = "";
  try {
    const verRes = await fetch(`/api/definitions/${definitionId}/versions`);
    const versions = (await verRes.json())?.data ?? [];
    if (versions.length) {
      const snapRes = await fetch(`/api/definitions/${definitionId}/versions/${versions[0].version}`);
      const snap = (await snapRes.json())?.data?.snapshot;
      if (snap) before = summarizeDefinition(snap.definition ?? {}, snap.conditions ?? []);
    }
  } catch {
    /* no previous version — describe the current definition */
  }

  const user = before
    ? `PREVIOUS:\n${before}\n\nCURRENT:\n${afterSummary}`
    : `DEFINITION:\n${afterSummary}`;

  // Generous token budget: free/reasoning models spend tokens "thinking" before
  // emitting the sentence, and a tight cap leaves `content` empty.
  return aiComplete({ ...config, system: REASON_PROMPT, user, maxTokens: 512, temperature: 0.3 });
}

/** Generates plain-English documentation from a definition summary string. */
export async function generateDocumentation(
  definitionSummary: string,
  config: AiConfig
): Promise<string> {
  return aiComplete({
    ...config,
    system: DOC_PROMPT,
    user: definitionSummary,
    maxTokens: 700,
    temperature: 0.3,
  });
}
