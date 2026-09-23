/**
 * Drift — the dashboard's view of how definitions change over time.
 *
 * Every shipped DefinitionVersion becomes a dot on a lane; the lines shown in
 * the version drawer are derived by diffing consecutive snapshots. Types here
 * are shared by the API route and the dashboard page.
 */
import { formatConditionSQL, type JoinClause } from "@/lib/compiler";

export type DriftKind = "create" | "edit" | "restore" | "retire" | "pending";
export type DriftType = "metric" | "rule" | "filter" | "flag";
export type DriftStatus = "published" | "pending" | "deprecated" | "draft";

export type DriftPerson = {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;
};

export type DriftVersion = {
  /** Stable key for React lists and drawer lookups. */
  key: string;
  /** Display label — "v4" for shipped versions, "pending" for change requests. */
  v: string;
  date: string;
  author: DriftPerson;
  approver: DriftPerson | null;
  reason: string;
  kind: DriftKind;
  removed: string[];
  added: string[];
  outputs: string[];
};

export type DriftDefinition = {
  id: string;
  name: string;
  type: DriftType;
  domain: string;
  owner: string;
  status: DriftStatus;
  versions: DriftVersion[];
};

export type DriftOverlap = { field: string; definitions: string[] };

export type DriftPayload = {
  generatedAt: string;
  definitions: DriftDefinition[];
  /** One entry per approved change request: when it was signed off, and how long it took. */
  signOffs: { date: string; days: number }[];
  overlaps: DriftOverlap[];
};

/** Type colours match the rest of the app: metric=blue, rule=purple, filter=amber, flag=red. */
export const DRIFT_TYPE_COLOR: Record<DriftType, string> = {
  metric: "var(--blue)",
  rule: "var(--purple)",
  filter: "var(--amber)",
  flag: "var(--red)",
};

const PERSON_COLORS = ["#60a5fa", "#a78bfa", "#fbbf24", "#4ade80", "#f87171", "#22d3ee"];

/** Deterministic avatar colour so the same person is the same colour everywhere. */
export function personColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PERSON_COLORS[h % PERSON_COLORS.length];
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

const ROLE_LABEL: Record<string, string> = {
  ENGINEER: "Data Engineer",
  ANALYST: "Analyst",
  ARCHITECT: "Architect",
  STAKEHOLDER: "Stakeholder",
  ADMIN: "Admin",
};

export function roleLabel(role: string, title?: string | null): string {
  return title?.trim() || ROLE_LABEL[role] || "Member";
}

type SnapshotLike = {
  definition?: {
    name?: string | null;
    sourceTable?: string | null;
    sourceValueField?: string | null;
    sourceDateField?: string | null;
    aggregationFn?: string | null;
    groupByPeriod?: string | null;
    dedupeBy?: string | null;
    dedupeStrategy?: string | null;
    joins?: JoinClause[] | null;
  } | null;
  conditions?: {
    connector: string;
    field: string;
    operator: string;
    value: string | null;
    valueType: string;
    order: number;
  }[];
};

function aggText(fn: string, field: string): string {
  switch (fn) {
    case "COUNT":
      return "COUNT(*)";
    case "AVERAGE":
      return `AVG(${field})`;
    case "DISTINCT_COUNT":
      return `COUNT(DISTINCT ${field})`;
    default:
      return `${fn}(${field})`;
  }
}

/**
 * Flattens a version snapshot into the logic lines the drawer diffs — the
 * source, aggregation, each condition, and the grouping/dedupe rules.
 */
export function snapshotLines(snapshot: unknown): string[] {
  const snap = (snapshot ?? {}) as SnapshotLike;
  const d = snap.definition;
  const lines: string[] = [];
  if (!d) return lines;

  if (d.sourceTable) lines.push(`FROM ${d.sourceTable}`);
  for (const j of d.joins ?? []) {
    if (j?.table && j?.on) lines.push(`${(j.type || "INNER").toUpperCase()} JOIN ${j.table} ON ${j.on}`);
  }
  if (d.aggregationFn) lines.push(aggText(d.aggregationFn, d.sourceValueField ?? "*"));

  const conditions = [...(snap.conditions ?? [])].sort((a, b) => a.order - b.order);
  conditions.forEach((c, i) => {
    if (!c.field) return;
    lines.push(`${i === 0 ? "WHERE" : c.connector} ${formatConditionSQL(c)}`);
  });

  if (d.groupByPeriod) {
    lines.push(`GROUP BY ${d.groupByPeriod} (${d.sourceDateField ?? "date"})`);
  }
  if (d.dedupeBy) {
    lines.push(`DEDUP BY ${d.dedupeBy} KEEP ${(d.dedupeStrategy ?? "FIRST").replace("KEEP_", "")}`);
  }
  return lines;
}

/** Lines present only in `prev` are removed; lines only in `next` are added. */
export function diffLines(prev: string[], next: string[]): { removed: string[]; added: string[] } {
  const before = new Set(prev);
  const after = new Set(next);
  return {
    removed: prev.filter((l) => !after.has(l)),
    added: next.filter((l) => !before.has(l)),
  };
}

/** Classifies a shipped version from its position and publish message. */
export function versionKind(
  version: number,
  description: string,
  isLatest: boolean,
  status: DriftStatus
): DriftKind {
  if (/^restored from v/i.test(description)) return "restore";
  if (isLatest && status === "deprecated") return "retire";
  if (version === 1) return "create";
  return "edit";
}
