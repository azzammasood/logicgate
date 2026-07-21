import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, getWorkspaceMember, requireWorkspaceMember } from "@/lib/api";
import { patchChangeRequestSchema } from "@/lib/validators";
import { canApprove } from "@/lib/permissions";
import { createVersionSnapshot } from "@/lib/versioning";
import { firePublishWebhook } from "@/lib/integrations";
import { buildSnapshot, definitionInclude, type DefinitionSnapshot } from "@/lib/definitions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const cr = await prisma.changeRequest.findUnique({
      where: { id },
      include: {
        definition: { include: definitionInclude },
        requestedBy: true,
        reviewedBy: true,
      },
    });
    if (!cr) {
      return apiResponse(null, { error: "Not found", status: 404 });
    }

    const memberResult = await requireWorkspaceMember(user.id, cr.definition.workspaceId);
    if ("error" in memberResult) return memberResult.error;

    const currentSnapshot = buildSnapshot(
      cr.definition,
      cr.definition.conditions,
      cr.definition.owners
    );

    return apiResponse({
      ...cr,
      currentSnapshot,
      proposedSnapshot: cr.proposedSnapshot,
    });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const cr = await prisma.changeRequest.findUnique({
      where: { id },
      include: { definition: true },
    });
    if (!cr) {
      return apiResponse(null, { error: "Not found", status: 404 });
    }

    const member = await getWorkspaceMember(user.id, cr.definition.workspaceId);
    if (!member || !canApprove(user, cr.definition, member)) {
      return apiResponse(null, { error: "Forbidden", status: 403 });
    }

    if (cr.requestedById === user.id) {
      return apiResponse(null, { error: "Cannot review own request", status: 403 });
    }

    const body = await request.json();
    const parsed = patchChangeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return apiResponse(null, { error: parsed.error.message, status: 400 });
    }

    if (parsed.data.status === "APPROVED") {
      const snapshot = cr.proposedSnapshot as unknown as DefinitionSnapshot;
      const def = snapshot.definition;

      await prisma.$transaction(async (tx) => {
        await tx.condition.deleteMany({ where: { definitionId: cr.definitionId } });
        await tx.definitionOwner.deleteMany({ where: { definitionId: cr.definitionId } });
        await tx.definition.update({
          where: { id: cr.definitionId },
          data: {
            name: def.name,
            description: def.description,
            documentation: (def as { documentation?: string | null }).documentation ?? null,
            type: def.type,
            status: "PUBLISHED",
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
        for (const c of snapshot.conditions ?? []) {
          await tx.condition.create({
            data: {
              definitionId: cr.definitionId,
              order: c.order,
              connector: c.connector,
              field: c.field,
              operator: c.operator,
              value: c.value,
              valueType: c.valueType,
            },
          });
        }
        for (const o of snapshot.owners ?? []) {
          await tx.definitionOwner.create({
            data: {
              definitionId: cr.definitionId,
              userId: o.userId,
              isPrimary: o.isPrimary,
            },
          });
        }
        await tx.changeRequest.update({
          where: { id },
          data: {
            status: "APPROVED",
            reviewedById: user.id,
            reviewNote: parsed.data.reviewNote ?? null,
          },
        });
        await tx.comment.create({
          data: {
            definitionId: cr.definitionId,
            authorId: user.id,
            body: `Change request approved: ${parsed.data.reviewNote ?? cr.changeDescription}`,
            changeRequestId: id,
          },
        });
      });

      const version = await createVersionSnapshot(
        cr.definitionId,
        user.id,
        `Approved change: ${cr.changeDescription}`
      );

      await firePublishWebhook(cr.definition.workspaceId, {
        definition: {
          id: cr.definitionId,
          name: def.name,
          type: def.type,
          status: "PUBLISHED",
          version,
        },
        message: `Approved change: ${cr.changeDescription}`,
      });
    } else {
      await prisma.$transaction([
        prisma.changeRequest.update({
          where: { id },
          data: {
            status: "REJECTED",
            reviewedById: user.id,
            reviewNote: parsed.data.reviewNote ?? null,
          },
        }),
        prisma.definition.update({
          where: { id: cr.definitionId },
          data: { status: "DRAFT" },
        }),
        prisma.comment.create({
          data: {
            definitionId: cr.definitionId,
            authorId: user.id,
            body: `Change request rejected: ${parsed.data.reviewNote ?? ""}`,
            changeRequestId: id,
          },
        }),
      ]);
    }

    const updated = await prisma.changeRequest.findUnique({
      where: { id },
      include: { definition: true, requestedBy: true, reviewedBy: true },
    });

    return apiResponse(updated);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
