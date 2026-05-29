import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, requireWorkspaceMember } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) {
      return apiResponse(null, { error: "workspaceId required", status: 400 });
    }

    const memberResult = await requireWorkspaceMember(user.id, workspaceId);
    if ("error" in memberResult) return memberResult.error;

    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

    const versions = await prisma.definitionVersion.findMany({
      where: {
        definition: { workspaceId },
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      select: {
        id: true,
        version: true,
        changeDescription: true,
        createdAt: true,
        changedBy: { select: { id: true, name: true, avatarInitials: true } },
        definition: { select: { id: true, name: true, type: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = versions.length > limit;
    const items = hasMore ? versions.slice(0, limit) : versions;
    const nextCursor = hasMore ? items[items.length - 1]?.createdAt.toISOString() : null;

    return apiResponse(items, { meta: { nextCursor, hasMore } });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}

