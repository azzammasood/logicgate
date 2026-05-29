import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, requireWorkspaceMember } from "@/lib/api";
import { createGroupSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const workspaceId = new URL(request.url).searchParams.get("workspaceId");
    if (!workspaceId) {
      return apiResponse(null, { error: "workspaceId required", status: 400 });
    }

    const memberResult = await requireWorkspaceMember(user.id, workspaceId);
    if ("error" in memberResult) return memberResult.error;

    const groups = await prisma.definitionGroup.findMany({
      where: { workspaceId },
      include: { _count: { select: { definitions: true } } },
    });

    return apiResponse(groups);
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
    const parsed = createGroupSchema.safeParse(body);
    if (!parsed.success) {
      return apiResponse(null, { error: parsed.error.message, status: 400 });
    }

    const memberResult = await requireWorkspaceMember(user.id, parsed.data.workspaceId);
    if ("error" in memberResult) return memberResult.error;

    const group = await prisma.definitionGroup.create({ data: parsed.data });
    return apiResponse(group, { status: 201 });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}

