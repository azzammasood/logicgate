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

    const definitions = await prisma.definition.findMany({
      where: {
        workspaceId,
        comments: { some: {} },
      },
      select: {
        id: true,
        name: true,
        comments: {
          select: {
            author: { select: { name: true } },
          },
        },
        _count: { select: { comments: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const threads = definitions.map((d) => {
      const participantNames = [
        ...new Set(d.comments.map((c) => c.author.name).filter(Boolean)),
      ];
      return {
        definitionId: d.id,
        definitionName: d.name,
        messageCount: d._count.comments,
        participants: participantNames,
      };
    });

    return apiResponse(threads);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
