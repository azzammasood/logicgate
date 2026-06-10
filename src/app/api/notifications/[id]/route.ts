import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const existing = await prisma.notification.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return apiResponse(null, { error: "Not found", status: 404 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return apiResponse(updated);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
