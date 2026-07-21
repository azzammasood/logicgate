import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, requireWorkspaceMember } from "@/lib/api";
import { updateWorkspaceSchema } from "@/lib/validators";
import { canManageTeam } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const memberResult = await requireWorkspaceMember(user.id, id);
    if ("error" in memberResult) return memberResult.error;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { members: { include: { user: true } } },
    });
    if (!workspace) {
      return apiResponse(null, { error: "Not found", status: 404 });
    }

    return apiResponse(workspace);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const memberResult = await requireWorkspaceMember(user.id, id);
    if ("error" in memberResult) return memberResult.error;
    const member = memberResult;

    if (!canManageTeam(user, member)) {
      return apiResponse(null, { error: "Forbidden", status: 403 });
    }

    const parsed = updateWorkspaceSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiResponse(null, { error: parsed.error.message, status: 400 });
    }

    const data = { ...parsed.data };

    // Once other members have joined, the org name is locked — silently drop a
    // rename attempt so the rest of the edits still save.
    if (data.name !== undefined) {
      const current = await prisma.workspace.findUnique({
        where: { id },
        select: { name: true, _count: { select: { members: true } } },
      });
      if (current && current._count.members > 1 && data.name !== current.name) {
        delete data.name;
      }
    }

    const updated = await prisma.workspace.update({
      where: { id },
      data: {
        ...data,
        workspaceSettings: data.workspaceSettings as object | undefined,
      },
    });

    return apiResponse(updated);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
