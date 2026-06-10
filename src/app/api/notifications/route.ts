import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser } from "@/lib/api";
import { notifyApprovalRequest } from "@/lib/notifications";

export async function GET() {
  try {
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    // Backfill approval notifications for pending reviews assigned to this user.
    const pendingForApprover = await prisma.changeRequest.findMany({
      where: {
        status: "PENDING",
        definition: { approverId: user.id },
      },
      include: { definition: true, requestedBy: true },
    });
    for (const cr of pendingForApprover) {
      await notifyApprovalRequest(
        user.id,
        cr.definitionId,
        cr.definition.name,
        cr.requestedBy.name,
        cr.id,
        cr.changeDescription
      );
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });

    return apiResponse({ notifications, unreadCount });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });

    return apiResponse({ ok: true });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
