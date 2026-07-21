import { z } from "zod";
import { openRouterChat, extractJson } from "@/lib/ai/openrouter";

const OPERATORS = [
  "EQUALS",
  "NOT_EQUALS",
  "IN",
  "NOT_IN",
  "GREATER_THAN",
  "LESS_THAN",
  "GREATER_EQUAL",
  "LESS_EQUAL",
  "IS_NULL",
  "IS_NOT_NULL",
  "CONTAINS",
  "STARTS_WITH",
] as const;

const VALUE_TYPES = ["STRING", "NUMBER", "BOOLEAN", "ARRAY", "NULL"] as const;

const conditionSchema = z.object({
  connector: z.enum(["IF", "AND", "OR"]).catch("AND"),
  field: z.string().trim().min(1),
  operator: z.enum(OPERATORS).catch("EQUALS"),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  // Coerce anything unexpected (e.g. "DATE", "DATETIME", "INT") to a valid type.
  valueType: z.preprocess((v) => {
    const s = typeof v === "string" ? v.toUpperCase() : "";
    if ((VALUE_TYPES as readonly string[]).includes(s)) return s;
    if (s === "INT" || s === "INTEGER" || s === "FLOAT" || s === "DECIMAL") return "NUMBER";
    if (s === "BOOL") return "BOOLEAN";
    if (s === "LIST") return "ARRAY";
    return "STRING"; // DATE, DATETIME, TIMESTAMP, unknown → STRING
  }, z.enum(VALUE_TYPES).catch("STRING")),
});

export type AiParseResult = {
  name: string | null;
  conditions: {
    connector: string;
    field: string;
    operator: string;
    value: string | null;
    valueType: string;
    order: number;
  }[];
  aggregation: { fn?: string | null; groupByPeriod?: string | null } | null;
  source: { table?: string | null; valueField?: string | null; dateField?: string | null } | null;
  explanation: string | null;
};

const SYSTEM_PROMPT = `You convert a plain-English description of a data metric or business rule into a structured JSON definition for LogicGate. Return ONLY a JSON object — no prose, no markdown fences.

Schema:
{
  "name": string | null,
  "conditions": [
    {
      "connector": "IF" | "AND" | "OR",         // the FIRST condition MUST be "IF"
      "field": string,                          // snake_case column name, e.g. last_login_date
      "operator": "EQUALS"|"NOT_EQUALS"|"IN"|"NOT_IN"|"GREATER_THAN"|"LESS_THAN"|"GREATER_EQUAL"|"LESS_EQUAL"|"IS_NULL"|"IS_NOT_NULL"|"CONTAINS"|"STARTS_WITH",
      "value": string | null,                   // ARRAY -> JSON array string like ["trial","free"]; null for IS_NULL/IS_NOT_NULL
      "valueType": "STRING"|"NUMBER"|"BOOLEAN"|"ARRAY"|"NULL"
    }
  ],
  "aggregation": { "fn": "SUM"|"COUNT"|"COUNT_DISTINCT"|"AVG"|"MIN"|"MAX"|null, "groupByPeriod": "day"|"week"|"month"|null } | null,
  "source": { "table": string | null, "valueField": string | null, "dateField": string | null } | null,
  "explanation": string
}

Rules:
- Return ONLY minified JSON — no markdown, no code fences, no commentary, no reasoning text.
- Infer sensible snake_case field names.
- Relative dates like "last 30 days" -> operator GREATER_EQUAL, valueType STRING, value "NOW() - 30 days".
- "not on a trial plan" -> field plan_type, operator NOT_IN, valueType ARRAY, value "[\\"trial\\"]".
- Booleans -> valueType BOOLEAN, value "true"/"false". Numbers -> valueType NUMBER.
- IS_NULL / IS_NOT_NULL -> value null, valueType NULL.
- valueType MUST be exactly one of STRING, NUMBER, BOOLEAN, ARRAY, NULL. Never use DATE.
- Only include aggregation/source if clearly implied; otherwise null. Keep it minimal and correct.`;

export type ParseOptions = {
  text: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
  webGrounding?: boolean;
  signal?: AbortSignal;
};

const topSchema = z.object({
  name: z.string().nullish(),
  aggregation: z
    .object({ fn: z.string().nullish(), groupByPeriod: z.string().nullish() })
    .nullish()
    .catch(null),
  source: z
    .object({
      table: z.string().nullish(),
      valueField: z.string().nullish(),
      dateField: z.string().nullish(),
    })
    .nullish()
    .catch(null),
  explanation: z.string().nullish(),
});

/**
 * Pure: turns a raw model string into a validated, normalized result (no
 * network). Extremely lenient — conditions are validated one-by-one and invalid
 * ones are dropped rather than failing the whole parse. Only throws if there is
 * no JSON at all.
 */
export function parseModelResponse(raw: string): AiParseResult {
  const data = extractJson(raw); // throws only when there's genuinely no JSON

  // Accept both { conditions: [...] } and a bare [...] of conditions.
  const obj: Record<string, unknown> = Array.isArray(data)
    ? { conditions: data }
    : data && typeof data === "object"
      ? (data as Record<string, unknown>)
      : {};

  const rawConditions = Array.isArray(obj.conditions)
    ? obj.conditions
    : Array.isArray(obj.filters)
      ? obj.filters
      : [];

  const conditions = rawConditions
    .map((c) => conditionSchema.safeParse(c))
    .filter((r): r is { success: true; data: z.infer<typeof conditionSchema> } => r.success)
    .map((r, i) => {
      const c = r.data;
      return {
        connector: i === 0 ? "IF" : c.connector === "IF" ? "AND" : c.connector,
        field: c.field.trim(),
        operator: c.operator,
        value:
          c.value === null || c.value === undefined
            ? null
            : typeof c.value === "string"
              ? c.value
              : String(c.value),
        valueType: c.valueType,
        order: i,
      };
    });

  const top = topSchema.safeParse(obj);
  const meta = top.success ? top.data : {};

  return {
    name: (meta.name as string | null | undefined) ?? null,
    conditions,
    aggregation: meta.aggregation ?? null,
    source: meta.source ?? null,
    explanation: (meta.explanation as string | null | undefined) ?? null,
  };
}

/**
 * Turns natural language into a structured definition. Runs entirely in the
 * browser — the API key goes straight to the chosen provider.
 */
export async function parseDefinition({
  text,
  apiKey,
  model,
  baseUrl,
  webGrounding,
  signal,
}: ParseOptions): Promise<AiParseResult> {
  // NOTE: we do NOT force response_format: json_object. The Free Models Router
  // (and some free models) don't support it and return an empty message. The
  // prompt already demands pure JSON, and extractJson() handles fences/prose.
  const raw = await openRouterChat({
    apiKey: apiKey.trim(),
    model: model.trim(),
    baseUrl,
    webGrounding,
    json: false,
    temperature: 0,
    maxTokens: 900,
    signal,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text.trim() },
    ],
  });

  return parseModelResponse(raw);
}
