import type { Definition, Condition, DefinitionOwner, User } from "@prisma/client";

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

