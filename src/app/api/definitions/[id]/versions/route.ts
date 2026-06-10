import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, requireWorkspaceMember } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const definition = await prisma.definition.findUnique({
      where: { id },
      select: { workspaceId: true },
    });
    if (!definition) {
      return apiResponse(null, { error: "Not found", status: 404 });
    }

    const memberResult = await requireWorkspaceMember(user.id, definition.workspaceId);
    if ("error" in memberResult) return memberResult.error;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 200, 500);

    // Exclude the heavy `snapshot` JSON from list payloads for speed.
    const versions = await prisma.definitionVersion.findMany({
      where: { definitionId: id },
      select: {
        id: true,
        version: true,
        changeDescription: true,
        documentation: true,
        createdAt: true,
        changedBy: { select: { id: true, name: true, avatarInitials: true } },
      },
      orderBy: { version: "desc" },
      take: limit,
    });

    return apiResponse(versions);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
