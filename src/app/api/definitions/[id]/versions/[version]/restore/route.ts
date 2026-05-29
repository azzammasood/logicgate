import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, getWorkspaceMember } from "@/lib/api";
import { canEdit } from "@/lib/permissions";
import { createVersionSnapshot } from "@/lib/versioning";
import type { DefinitionSnapshot } from "@/lib/definitions";

type Params = { params: Promise<{ id: string; version: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id, version: versionStr } = await params;
    const version = parseInt(versionStr, 10);
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const definition = await prisma.definition.findUnique({ where: { id } });
    if (!definition) {
      return apiResponse(null, { error: "Not found", status: 404 });
    }

    const member = await getWorkspaceMember(user.id, definition.workspaceId);
    if (!member || !canEdit(user, definition, member)) {
      return apiResponse(null, { error: "Forbidden", status: 403 });
    }

    const versionRecord = await prisma.definitionVersion.findUnique({
      where: { definitionId_version: { definitionId: id, version } },
    });
    if (!versionRecord) {
      return apiResponse(null, { error: "Version not found", status: 404 });
    }

    const snapshot = versionRecord.snapshot as unknown as DefinitionSnapshot;
    const def = snapshot.definition;

    await prisma.$transaction(async (tx) => {
      await tx.condition.deleteMany({ where: { definitionId: id } });
      await tx.definitionOwner.deleteMany({ where: { definitionId: id } });
      await tx.definition.update({
        where: { id },
        data: {
          name: def.name,
          description: def.description,
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
          ownerId: def.ownerId,
          approverId: def.approverId,
        },
      });
      for (const c of snapshot.conditions) {
        await tx.condition.create({
          data: {
            definitionId: id,
            order: c.order,
            connector: c.connector,
            field: c.field,
            operator: c.operator,
            value: c.value,
            valueType: c.valueType,
          },
        });
      }
      for (const o of snapshot.owners) {
        await tx.definitionOwner.create({
          data: {
            definitionId: id,
            userId: o.userId,
            isPrimary: o.isPrimary,
          },
        });
      }
    });

    await createVersionSnapshot(id, user.id, `Restored from v${version}`);

    const refreshed = await prisma.definition.findUnique({
      where: { id },
      include: { conditions: { orderBy: { order: "asc" } }, owners: true },
    });

    return apiResponse(refreshed);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
