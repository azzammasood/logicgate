import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, requireWorkspaceMember } from "@/lib/api";

type Params = { params: Promise<{ id: string; version: string }> };

export async function GET(_request: Request, { params }: Params) {
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

    const memberResult = await requireWorkspaceMember(user.id, definition.workspaceId);
    if ("error" in memberResult) return memberResult.error;

    const record = await prisma.definitionVersion.findUnique({
      where: { definitionId_version: { definitionId: id, version } },
      include: { changedBy: true },
    });
    if (!record) {
      return apiResponse(null, { error: "Version not found", status: 404 });
    }

    return apiResponse(record);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
