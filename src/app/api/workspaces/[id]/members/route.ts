import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, requireWorkspaceMember, getInitials } from "@/lib/api";
import { inviteMemberSchema } from "@/lib/validators";
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

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      include: {
        user: {
          include: {
            _count: { select: { ownedDefinitions: true } },
          },
        },
      },
    });

    return apiResponse(members);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id: workspaceId } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const memberResult = await requireWorkspaceMember(user.id, workspaceId);
    if ("error" in memberResult) return memberResult.error;

    if (!canManageTeam(user, memberResult)) {
      return apiResponse(null, { error: "Forbidden", status: 403 });
    }

    const parsed = inviteMemberSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiResponse(null, { error: parsed.error.message, status: 400 });
    }

    const invitedUser = await prisma.user.upsert({
      where: { email: parsed.data.email },
      create: {
        email: parsed.data.email,
        name: parsed.data.email.split("@")[0],
        avatarInitials: getInitials(parsed.data.email.split("@")[0]),
      },
      update: {},
    });

    const member = await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: { userId: invitedUser.id, workspaceId },
      },
      create: {
        userId: invitedUser.id,
        workspaceId,
        role: parsed.data.role,
      },
      update: { role: parsed.data.role },
      include: { user: true },
    });

    return apiResponse(member, { status: 201 });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
