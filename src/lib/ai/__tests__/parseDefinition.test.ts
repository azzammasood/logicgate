import { extractJson } from "@/lib/ai/openrouter";
import { parseModelResponse } from "@/lib/ai/parseDefinition";

describe("extractJson", () => {
  it("parses plain JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("parses fenced ```json blocks", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("parses fenced blocks without a language tag", () => {
    expect(extractJson('```\n{"a":2}\n```')).toEqual({ a: 2 });
  });

  it("ignores prose around the JSON", () => {
    expect(extractJson('Sure! Here it is:\n{"a":3}\nHope that helps.')).toEqual({ a: 3 });
  });

  it("strips <think> reasoning tags", () => {
    expect(extractJson('<think>let me reason {not json}</think>{"a":4}')).toEqual({ a: 4 });
  });

  it("tolerates trailing commas", () => {
    expect(extractJson('{"a":1,"b":[1,2,],}')).toEqual({ a: 1, b: [1, 2] });
  });

  it("matches balanced braces when trailing junk follows", () => {
    expect(extractJson('{"a":{"b":1}} some trailing text ]]')).toEqual({ a: { b: 1 } });
  });

  it("throws when there is no JSON", () => {
    expect(() => extractJson("no json here")).toThrow();
  });
});

describe("parseModelResponse", () => {
  it("parses the canonical active-users example", () => {
    const raw = JSON.stringify({
      name: "Active Users",
      conditions: [
        { connector: "IF", field: "last_login_date", operator: "GREATER_EQUAL", value: "NOW() - 30 days", valueType: "STRING" },
        { connector: "AND", field: "plan_type", operator: "NOT_IN", value: '["trial"]', valueType: "ARRAY" },
      ],
      aggregation: null,
      source: null,
      explanation: "ok",
    });
    const r = parseModelResponse(raw);
    expect(r.conditions).toHaveLength(2);
    expect(r.conditions[0].connector).toBe("IF");
    expect(r.conditions[1].operator).toBe("NOT_IN");
  });

  it("coerces DATE valueType (invalid) to STRING", () => {
    const raw = JSON.stringify({
      conditions: [{ connector: "IF", field: "created_at", operator: "GREATER_EQUAL", value: "NOW() - 7 days", valueType: "DATE" }],
    });
    const r = parseModelResponse(raw);
    expect(r.conditions[0].valueType).toBe("STRING");
  });

  it("coerces numeric-ish valueTypes to NUMBER", () => {
    const raw = JSON.stringify({
      conditions: [{ connector: "IF", field: "amount", operator: "GREATER_THAN", value: 100, valueType: "INTEGER" }],
    });
    const r = parseModelResponse(raw);
    expect(r.conditions[0].valueType).toBe("NUMBER");
    expect(r.conditions[0].value).toBe("100"); // numbers stringified for the store
  });

  it("keeps NULL valueType for IS_NULL", () => {
    const raw = JSON.stringify({
      conditions: [{ connector: "IF", field: "deleted_at", operator: "IS_NULL", value: null, valueType: "NULL" }],
    });
    const r = parseModelResponse(raw);
    expect(r.conditions[0].valueType).toBe("NULL");
    expect(r.conditions[0].value).toBeNull();
  });

  it("forces the first connector to IF", () => {
    const raw = JSON.stringify({
      conditions: [{ connector: "AND", field: "status", operator: "EQUALS", value: "active", valueType: "STRING" }],
    });
    const r = parseModelResponse(raw);
    expect(r.conditions[0].connector).toBe("IF");
  });

  it("falls back invalid operators/connectors instead of throwing", () => {
    const raw = JSON.stringify({
      conditions: [{ connector: "WHEN", field: "x", operator: "MATCHES", value: "y", valueType: "weird" }],
    });
    const r = parseModelResponse(raw);
    expect(r.conditions[0].operator).toBe("EQUALS");
    expect(r.conditions[0].valueType).toBe("STRING");
  });

  it("drops conditions with empty fields", () => {
    const raw = JSON.stringify({
      conditions: [
        { connector: "IF", field: "status", operator: "EQUALS", value: "active", valueType: "STRING" },
        { connector: "AND", field: "  ", operator: "EQUALS", value: "x", valueType: "STRING" },
      ],
    });
    const r = parseModelResponse(raw);
    expect(r.conditions).toHaveLength(1);
  });

  it("handles a definition with no conditions", () => {
    const r = parseModelResponse('{"name":"Total Rows","conditions":[],"aggregation":{"fn":"COUNT","groupByPeriod":"month"}}');
    expect(r.conditions).toHaveLength(0);
    expect(r.aggregation?.fn).toBe("COUNT");
  });

  it("parses fenced + prose model output end-to-end", () => {
    const raw = 'Here is the definition:\n```json\n{"conditions":[{"connector":"IF","field":"is_internal","operator":"EQUALS","value":"false","valueType":"BOOLEAN"}]}\n```';
    const r = parseModelResponse(raw);
    expect(r.conditions[0].valueType).toBe("BOOLEAN");
    expect(r.conditions[0].value).toBe("false");
  });
});
