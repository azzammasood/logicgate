import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, requireWorkspaceMember } from "@/lib/api";
import { createChangeRequestSchema } from "@/lib/validators";
import { notifyApprovalRequest } from "@/lib/notifications";

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
        definition: true,
        requestedBy: true,
        reviewedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(requests);
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
        proposedSnapshot: parsed.data.proposedSnapshot as object,
        status: "PENDING",
      },
      include: { definition: true, requestedBy: true },
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

