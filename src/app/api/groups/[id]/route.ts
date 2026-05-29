import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, requireWorkspaceMember } from "@/lib/api";
import { updateGroupSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const group = await prisma.definitionGroup.findUnique({ where: { id } });
    if (!group) return apiResponse(null, { error: "Not found", status: 404 });

    const memberResult = await requireWorkspaceMember(user.id, group.workspaceId);
    if ("error" in memberResult) return memberResult.error;

    const parsed = updateGroupSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiResponse(null, { error: parsed.error.message, status: 400 });
    }

    const updated = await prisma.definitionGroup.update({
      where: { id },
      data: parsed.data,
    });
    return apiResponse(updated);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const group = await prisma.definitionGroup.findUnique({ where: { id } });
    if (!group) return apiResponse(null, { error: "Not found", status: 404 });

    const memberResult = await requireWorkspaceMember(user.id, group.workspaceId);
    if ("error" in memberResult) return memberResult.error;

    await prisma.definitionGroup.delete({ where: { id } });
    return apiResponse({ deleted: true });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
