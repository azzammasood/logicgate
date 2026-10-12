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
