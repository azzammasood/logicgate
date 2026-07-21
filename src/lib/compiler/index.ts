export type JoinClause = { table: string; type: string; on: string };

export interface CompilerInput {
  definition: {
    name: string;
    sourceTable: string | null;
    sourceValueField: string | null;
    sourceDateField: string | null;
    aggregationFn: string | null;
    groupByPeriod: string | null;
    dedupeBy: string | null;
    dedupeStrategy: string | null;
    joins?: JoinClause[] | null;
  };
  conditions: Array<{
    connector: string;
    field: string;
    operator: string;
    value: string | null;
    valueType: string;
    order: number;
  }>;
}

export type CompileFormat = "generic" | "sql" | "python" | "dbt";

const VALID_OPERATORS = new Set([
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
]);

function parseValue(value: string | null, valueType: string): string | string[] | number | boolean | null {
  if (valueType === "NULL" || value === null) return null;
  if (valueType === "ARRAY") {
    try {
      return JSON.parse(value) as string[];
    } catch {
      return value.split(",").map((s) => s.trim());
    }
  }
  if (valueType === "NUMBER") return Number(value);
  if (valueType === "BOOLEAN") return value === "true";
  return value;
}

function formatConditionGeneric(c: CompilerInput["conditions"][0], indent: string): string {
  if (!VALID_OPERATORS.has(c.operator)) return `${indent}-- skipped invalid operator: ${c.operator}`;
  const v = parseValue(c.value, c.valueType);
  switch (c.operator) {
    case "EQUALS":
      return `${indent}${c.field} = ${JSON.stringify(v)}`;
    case "NOT_EQUALS":
      return `${indent}${c.field} != ${JSON.stringify(v)}`;
    case "IN":
      return `${indent}${c.field} IN ${JSON.stringify(v)}`;
    case "NOT_IN":
      return `${indent}${c.field} NOT IN ${JSON.stringify(v)}`;
    case "GREATER_THAN":
      return `${indent}${c.field} > ${v}`;
    case "LESS_THAN":
      return `${indent}${c.field} < ${v}`;
    case "GREATER_EQUAL":
      return `${indent}${c.field} >= ${v}`;
    case "LESS_EQUAL":
      return `${indent}${c.field} <= ${v}`;
    case "IS_NULL":
      return `${indent}${c.field} IS NULL`;
    case "IS_NOT_NULL":
      return `${indent}${c.field} IS NOT NULL`;
    case "CONTAINS":
      return `${indent}${c.field} CONTAINS ${JSON.stringify(v)}`;
    case "STARTS_WITH":
      return `${indent}${c.field} STARTS_WITH ${JSON.stringify(v)}`;
    default:
      return `${indent}-- unknown operator`;
  }
}

function formatConditionSQL(c: CompilerInput["conditions"][0]): string {
  if (!VALID_OPERATORS.has(c.operator)) return `-- skipped invalid operator: ${c.operator}`;
  const v = parseValue(c.value, c.valueType);
  const field = c.field;
  switch (c.operator) {
    case "EQUALS":
      return `${field} = '${v}'`;
    case "NOT_EQUALS":
      return `${field} != '${v}'`;
    case "IN": {
      const arr = Array.isArray(v) ? v : [v];
      return `${field} IN (${arr.map((x) => `'${x}'`).join(", ")})`;
    }
    case "NOT_IN": {
      const arr = Array.isArray(v) ? v : [v];
      return `${field} NOT IN (${arr.map((x) => `'${x}'`).join(", ")})`;
    }
    case "GREATER_THAN":
      return `${field} > ${v}`;
    case "LESS_THAN":
      return `${field} < ${v}`;
    case "GREATER_EQUAL":
      return `${field} >= ${v}`;
    case "LESS_EQUAL":
      return `${field} <= ${v}`;
    case "IS_NULL":
      return `${field} IS NULL`;
    case "IS_NOT_NULL":
      return `${field} IS NOT NULL`;
    case "CONTAINS":
      return `${field} LIKE '%${v}%'`;
    case "STARTS_WITH":
      return `${field} LIKE '${v}%'`;
    default:
      return `-- unknown`;
  }
}

function periodSQL(period: string | null, dateField: string): string {
  switch (period) {
    case "CALENDAR_MONTH":
      return `DATE_TRUNC('month', ${dateField})`;
    case "WEEK":
      return `DATE_TRUNC('week', ${dateField})`;
    case "DAY":
      return `DATE_TRUNC('day', ${dateField})`;
    case "QUARTER":
      return `DATE_TRUNC('quarter', ${dateField})`;
    case "YEAR":
      return `DATE_TRUNC('year', ${dateField})`;
    default:
      return dateField;
  }
}

function aggSQL(fn: string | null, field: string): string {
  if (!fn) return field;
  switch (fn) {
    case "SUM":
      return `SUM(${field})`;
    case "COUNT":
      return `COUNT(*)`;
    case "AVERAGE":
      return `AVG(${field})`;
    case "DISTINCT_COUNT":
      return `COUNT(DISTINCT ${field})`;
    case "MIN":
      return `MIN(${field})`;
    case "MAX":
      return `MAX(${field})`;
    default:
      return field;
  }
}

const slug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

/** Valid, non-empty joins with an uppercased join type. */
function cleanJoins(joins: JoinClause[] | null | undefined): JoinClause[] {
  return (joins ?? [])
    .filter((j) => j.table?.trim() && j.on?.trim())
    .map((j) => ({
      table: j.table.trim(),
      on: j.on.trim(),
      type: (j.type || "INNER").toUpperCase(),
    }));
}

export function compileGeneric(input: CompilerInput): string {
  const { definition: d, conditions } = input;
  const name = slug(d.name);
  const lines: string[] = [
    `-- Definition: ${d.name}`,
    `DEFINE ${name}(month):`,
  ];
  if (!d.sourceTable) {
    lines.push("  -- source table not set");
  } else {
    lines.push(`  FROM ${d.sourceTable}`);
    for (const j of cleanJoins(d.joins)) {
      lines.push(`  ${j.type} JOIN ${j.table} ON ${j.on}`);
    }
  }
  lines.push("  WHERE");
  if (conditions.length === 0) {
    lines.push("    -- no filters applied");
  } else {
    conditions
      .sort((a, b) => a.order - b.order)
      .forEach((c, i) => {
        const prefix = i === 0 ? "    " : `    ${c.connector} `;
        lines.push(formatConditionGeneric(c, prefix));
      });
  }
  if (!d.aggregationFn) {
    const cols = d.sourceValueField ?? "*";
    lines.push(`  RETURN ROWS (${cols})`);
    lines.push("  -- no aggregation — filtered list / record set");
  } else {
    const ret = `${d.aggregationFn}(${d.sourceValueField ?? "*"})`;
    lines.push(`  RETURN ${ret}`);
    if (d.groupByPeriod) lines.push(`  GROUP BY ${d.groupByPeriod.toLowerCase()}`);
  }
  if (d.dedupeBy) {
    lines.push(`  DEDUP BY ${d.dedupeBy} ${d.dedupeStrategy ?? "KEEP_FIRST"}`);
  }
  return lines.join("\n");
}

export function compileSQL(input: CompilerInput): string {
  const { definition: d, conditions } = input;
  if (!d.sourceTable) return "-- source table not set";
  const valueField = d.sourceValueField ?? "*";
  const dateField = d.sourceDateField ?? "created_at";
  const joinLines = cleanJoins(d.joins).map(
    (j) => `${j.type} JOIN ${j.table} ON ${j.on}`
  );
  const fromClause = [`FROM ${d.sourceTable}`, ...joinLines].join("\n");
  const where =
    conditions.length === 0
      ? "  -- no filters applied"
      : conditions
          .sort((a, b) => a.order - b.order)
          .map((c, i) => {
            const prefix = i === 0 ? "  " : `  ${c.connector === "OR" ? "OR" : "AND"} `;
            return prefix + formatConditionSQL(c);
          })
          .join("\n");

  if (!d.aggregationFn) {
    return `SELECT
  ${valueField}
${fromClause}
WHERE
${where}`;
  }

  const period = periodSQL(d.groupByPeriod, dateField);
  const agg = aggSQL(d.aggregationFn, valueField);
  const groupClause = d.groupByPeriod ? `\nGROUP BY ${period}` : "";
  return `SELECT
  ${period} AS period,
  ${agg} AS ${slug(d.name)}
${fromClause}
WHERE
${where}${groupClause}`;
}

export function compilePython(input: CompilerInput): string {
  const { definition: d, conditions } = input;
  const fn = slug(d.name);
  const table = d.sourceTable ?? "df";
  const joins = cleanJoins(d.joins);
  const lines = [
    `def ${fn}(df: pd.DataFrame, month: str) -> pd.Series:`,
    `    """Auto-generated by LogicGate"""`,
    ...joins.map(
      (j) => `    # ${j.type} JOIN ${j.table} ON ${j.on} — e.g. df = df.merge(${j.table}, ...)`
    ),
    `    result = df[`,
  ];
  if (conditions.length === 0) {
    lines.push("        # no filters applied");
    lines.push("        True");
  } else {
    conditions
      .sort((a, b) => a.order - b.order)
      .forEach((c) => {
        if (!VALID_OPERATORS.has(c.operator)) {
          lines.push(`        # skipped invalid operator: ${c.operator}`);
          return;
        }
        const v = parseValue(c.value, c.valueType);
        if (c.operator === "EQUALS")
          lines.push(`        (df['${c.field}'] == ${JSON.stringify(v)}) &`);
        else if (c.operator === "NOT_IN" && Array.isArray(v))
          lines.push(`        (~df['${c.field}'].isin(${JSON.stringify(v)})) &`);
        else if (c.operator === "IN" && Array.isArray(v))
          lines.push(`        (df['${c.field}'].isin(${JSON.stringify(v)})) &`);
        else if (c.operator === "GREATER_THAN")
          lines.push(`        (df['${c.field}'] > ${v}) &`);
        else if (c.operator === "IS_NULL")
          lines.push(`        (df['${c.field}'].isna()) &`);
        else
          lines.push(`        (df['${c.field}'] == ${JSON.stringify(v)}) &`);
      });
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ &$/, "");
  }
  lines.push("    ]");
  const dateField = d.sourceDateField ?? "transaction_date";
  const valueField = d.sourceValueField ?? "amount";

  if (!d.aggregationFn) {
    lines.push(`    return result  # filtered rows (no aggregation)`);
    return lines.join("\n");
  }

  if (d.groupByPeriod) {
    lines.push(
      `    result = result.groupby(pd.Grouper(key='${dateField}', freq='MS'))`
    );
  }
  const agg = d.aggregationFn.toLowerCase();
  lines.push(`    return result['${valueField}'].${agg}()`);
  return lines.join("\n");
}

export function compileDbt(input: CompilerInput): string {
  const sql = compileSQL(input);
  const table = input.definition.sourceTable ?? "source_table";
  const refTable = table.replace(/[^a-z0-9_]/gi, "_");
  return `{{ config(materialized='table') }}
-- auto-generated by LogicGate | definition: ${slug(input.definition.name)}
${sql.replace(`FROM ${table}`, `FROM {{ ref('${refTable}') }}`)}`;
}

export function compile(input: CompilerInput, format: CompileFormat): string {
  switch (format) {
    case "sql":
      return compileSQL(input);
    case "python":
      return compilePython(input);
    case "dbt":
      return compileDbt(input);
    default:
      return compileGeneric(input);
  }
}

