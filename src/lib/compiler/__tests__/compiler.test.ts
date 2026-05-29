import {
  compile,
  compileGeneric,
  compileSQL,
  compilePython,
  compileDbt,
  type CompilerInput,
} from "../index";

const baseInput: CompilerInput = {
  definition: {
    name: "Monthly Active Revenue",
    sourceTable: "transactions",
    sourceValueField: "amount_usd",
    sourceDateField: "transaction_date",
    aggregationFn: "SUM",
    groupByPeriod: "CALENDAR_MONTH",
    dedupeBy: "user_id",
    dedupeStrategy: "KEEP_FIRST",
  },
  conditions: [
    {
      connector: "IF",
      field: "status",
      operator: "EQUALS",
      value: "completed",
      valueType: "STRING",
      order: 0,
    },
    {
      connector: "AND",
      field: "type",
      operator: "NOT_IN",
      value: '["refund","chargeback"]',
      valueType: "ARRAY",
      order: 1,
    },
  ],
};

describe("compiler", () => {
  it("compileGeneric basic case", () => {
    const out = compileGeneric(baseInput);
    expect(out).toContain("Monthly Active Revenue");
    expect(out).toContain("FROM transactions");
    expect(out).toContain("status");
    expect(out).toContain("SUM");
  });

  it("no conditions", () => {
    const out = compileGeneric({ ...baseInput, conditions: [] });
    expect(out).toContain("no filters applied");
  });

  it("null source table", () => {
    const out = compileGeneric({
      ...baseInput,
      definition: { ...baseInput.definition, sourceTable: null },
    });
    expect(out).toContain("source table not set");
  });

  it("array values in SQL", () => {
    const out = compileSQL(baseInput);
    expect(out).toContain("SELECT");
    expect(out).toContain("transactions");
    expect(out).toContain("NOT IN");
  });

  it("compilePython", () => {
    const out = compilePython(baseInput);
    expect(out).toContain("def monthly_active_revenue");
    expect(out).toContain("pd.DataFrame");
  });

  it("compileDbt", () => {
    const out = compileDbt(baseInput);
    expect(out).toContain("config(materialized");
    expect(out).toContain("ref(");
  });

  it("compile dispatcher", () => {
    expect(compile(baseInput, "sql")).toContain("SELECT");
    expect(compile(baseInput, "generic")).toContain("DEFINE");
    expect(compile(baseInput, "python")).toContain("def ");
    expect(compile(baseInput, "dbt")).toContain("{{");
  });

  it("invalid operator skipped", () => {
    const out = compileGeneric({
      ...baseInput,
      conditions: [
        {
          connector: "IF",
          field: "x",
          operator: "INVALID",
          value: "1",
          valueType: "STRING",
          order: 0,
        },
      ],
    });
    expect(out).toContain("skipped invalid operator");
  });
});
