import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser } from "@/lib/api";

type Params = { params: Promise<{ token: string }> };

/**
 * Accept a workspace invite link. The token is the workspace's invite code
 * (stored in workspaceSettings.inviteCode). Adds the signed-in user to the
 * workspace as a VIEWER if they aren't already a member. Idempotent.
 */
export async function POST(_request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    if (!token || token.length < 16) {
      return apiResponse(null, { error: "Invalid invite link.", status: 400 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: { workspaceSettings: { path: ["inviteCode"], equals: token } },
    });
    if (!workspace) {
      return apiResponse(null, {
        error: "This invite link is invalid or has been revoked.",
        status: 404,
      });
    }

    const existing = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    });

    if (!existing) {
      await prisma.workspaceMember.create({
        data: { userId: user.id, workspaceId: workspace.id, role: "VIEWER" },
      });
    }

    return apiResponse({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      alreadyMember: !!existing,
    });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
