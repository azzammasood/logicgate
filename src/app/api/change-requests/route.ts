import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, requireWorkspaceMember } from "@/lib/api";
import { createChangeRequestSchema } from "@/lib/validators";
import { notifyApprovalRequest } from "@/lib/notifications";
import { baselineSnapshot, buildSnapshot, definitionInclude, normalizeSnapshot } from "@/lib/definitions";

export async function GET(request: Request) {
  try {
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const status = searchParams.get("status");
    const definitionId = searchParams.get("definitionId");
    const approverId = searchParams.get("approverId");

    if (!workspaceId) {
      return apiResponse(null, { error: "workspaceId required", status: 400 });
    }

    const memberResult = await requireWorkspaceMember(user.id, workspaceId);
    if ("error" in memberResult) return memberResult.error;

    const requests = await prisma.changeRequest.findMany({
      where: {
        ...(status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {}),
        ...(definitionId ? { definitionId } : {}),
        definition: {
          workspaceId,
          ...(approverId ? { approverId } : {}),
        },
      },
      include: {
        definition: { include: definitionInclude },
        requestedBy: true,
        reviewedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Diff each request against the live version it was raised against, not
    // the definition row (which holds the autosaved draft).
    const withBaselines = await Promise.all(
      requests.map(async (cr) => {
        const draft = buildSnapshot(cr.definition, cr.definition.conditions, cr.definition.owners);
        const currentSnapshot = await baselineSnapshot(cr.definitionId, cr.createdAt, draft);
        return {
          ...cr,
          currentSnapshot,
          proposedSnapshot: normalizeSnapshot(cr.proposedSnapshot, draft),
        };
      })
    );

    return apiResponse(withBaselines);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const body = await request.json();
    const parsed = createChangeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return apiResponse(null, { error: parsed.error.message, status: 400 });
    }

    const definition = await prisma.definition.findUnique({
      where: { id: parsed.data.definitionId },
      include: definitionInclude,
    });
    if (!definition) {
      return apiResponse(null, { error: "Definition not found", status: 404 });
    }

    const memberResult = await requireWorkspaceMember(user.id, definition.workspaceId);
    if ("error" in memberResult) return memberResult.error;

    const cr = await prisma.changeRequest.create({
      data: {
        definitionId: parsed.data.definitionId,
        requestedById: user.id,
        changeDescription: parsed.data.changeDescription,
        // Snapshot the saved draft server-side so the stored shape always
        // matches what review/approval expect, whatever the client sends.
        // Approval publishes it, so record that rather than the draft status.
        proposedSnapshot: buildSnapshot(
          { ...definition, status: "PUBLISHED" },
          definition.conditions,
          definition.owners
        ) as unknown as object,
        status: "PENDING",
      },
      include: { requestedBy: true },
    });

    await prisma.definition.update({
      where: { id: definition.id },
      data: { status: "PENDING_REVIEW" },
    });

    if (definition.approverId) {
      await notifyApprovalRequest(
        definition.approverId,
        definition.id,
        definition.name,
        user.name,
        cr.id,
        parsed.data.changeDescription
      );
    }

    return apiResponse(cr, { status: 201 });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}

