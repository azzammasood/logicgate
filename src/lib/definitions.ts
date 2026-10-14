import type { Definition, Condition, DefinitionOwner, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DefinitionSnapshot = {
  definition: Definition;
  conditions: Condition[];
  owners: DefinitionOwner[];
};

export function buildSnapshot(
  definition: Definition,
  conditions: Condition[],
  owners: DefinitionOwner[]
): DefinitionSnapshot {
  return { definition, conditions, owners };
}

export const definitionInclude = {
  conditions: { orderBy: { order: "asc" as const } },
  owners: { include: { user: { select: { id: true, name: true, email: true, avatarInitials: true } } } },
  owner: true,
  approver: true,
  group: true,
  changeRequests: {
    where: { status: "PENDING" as const },
    include: { requestedBy: true },
  },
  versions: { orderBy: { version: "desc" as const }, take: 1 },
};


/**
 * Change requests created before snapshots were built server-side stored a
 * flat `{ name, type, …, conditions }` object. Coerce either shape into a
 * full snapshot, filling anything the flat form lacks from `fallback`.
 */
export function normalizeSnapshot(
  raw: unknown,
  fallback: DefinitionSnapshot
): DefinitionSnapshot {
  const obj = (raw ?? {}) as Record<string, unknown>;
  if (obj.definition && typeof obj.definition === "object") {
    const s = obj as Partial<DefinitionSnapshot>;
    return {
      definition: s.definition!,
      conditions: s.conditions ?? [],
      owners: s.owners ?? fallback.owners,
    };
  }
  const { conditions, ...fields } = obj;
  return {
    definition: { ...fallback.definition, ...fields } as Definition,
    conditions: (conditions as Condition[] | undefined) ?? [],
    owners: fallback.owners,
  };
}

/**
 * The live (published) state a change request was raised against: the last
 * version recorded before the request. The definition row itself holds the
 * autosaved draft, so it can't serve as the "before" side of a diff.
 */
export async function baselineSnapshot(
  definitionId: string,
  before: Date,
  fallback: DefinitionSnapshot
): Promise<DefinitionSnapshot> {
  const version = await prisma.definitionVersion.findFirst({
    where: { definitionId, createdAt: { lt: before } },
    orderBy: { version: "desc" },
    select: { snapshot: true },
  });
  return version ? normalizeSnapshot(version.snapshot, fallback) : fallback;
}

// Fields that make up a definition's logic. Status/version bookkeeping is
// excluded so publishing itself never reads as an "unpublished change".
const LOGIC_FIELDS = [
  "name",
  "description",
  "documentation",
  "type",
  "sourceTable",
  "sourceValueField",
  "sourceDateField",
  "currency",
  "aggregationFn",
  "groupByPeriod",
  "dedupeBy",
  "dedupeStrategy",
  "joins",
] as const;

function logicFingerprint(definition: Record<string, unknown>, conditions: Condition[]) {
  const fields = LOGIC_FIELDS.map((k) => JSON.stringify(definition[k] ?? null));
  const conds = [...conditions]
    .sort((a, b) => a.order - b.order)
    .map((c) => [c.connector, c.field, c.operator, c.value ?? null]);
  return JSON.stringify([fields, conds]);
}

/**
 * True when the definition row (which autosave writes to) differs from its
 * latest published version. Never-published definitions count as unpublished.
 */
export function hasUnpublishedChanges(
  definition: Definition & { conditions: Condition[] },
  latestVersionSnapshot: unknown
): boolean {
  if (!latestVersionSnapshot) return true;
  const published = normalizeSnapshot(latestVersionSnapshot, {
    definition,
    conditions: [],
    owners: [],
  });
  return (
    logicFingerprint(definition as unknown as Record<string, unknown>, definition.conditions) !==
    logicFingerprint(
      published.definition as unknown as Record<string, unknown>,
      published.conditions
    )
  );
}

/** Overwrite a definition's logic + conditions with a stored snapshot (no new version). */
export async function applyLogicSnapshot(
  definitionId: string,
  snapshot: DefinitionSnapshot,
  documentationFallback: string | null
) {
  const def = snapshot.definition;
  await prisma.$transaction(async (tx) => {
    await tx.condition.deleteMany({ where: { definitionId } });
    await tx.definition.update({
      where: { id: definitionId },
      data: {
        name: def.name,
        description: def.description,
        documentation:
          (def as { documentation?: string | null }).documentation ?? documentationFallback,
        type: def.type,
        status: def.status,
        sourceTable: def.sourceTable,
        sourceValueField: def.sourceValueField,
        sourceDateField: def.sourceDateField,
        currency: def.currency,
        aggregationFn: def.aggregationFn,
        groupByPeriod: def.groupByPeriod,
        dedupeBy: def.dedupeBy,
        dedupeStrategy: def.dedupeStrategy,
        ...(def.joins !== undefined ? { joins: def.joins ?? undefined } : {}),
      },
    });
    for (const c of snapshot.conditions) {
      await tx.condition.create({
        data: {
          definitionId,
          order: c.order,
          connector: c.connector,
          field: c.field,
          operator: c.operator,
          value: c.value,
          valueType: c.valueType,
        },
      });
    }
  });
}
