import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, slugify } from "@/lib/api";
import { createWorkspaceSchema } from "@/lib/validators";

export async function GET() {
  try {
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: {
        workspace: {
          include: { _count: { select: { members: true, definitions: true } } },
        },
      },
      orderBy: { workspace: { name: "asc" } },
    });

    return apiResponse(
      memberships.map((m) => ({
        ...m.workspace,
        role: m.role,
      }))
    );
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
    const parsed = createWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return apiResponse(null, { error: parsed.error.message, status: 400 });
    }

    const slug = parsed.data.slug ?? slugify(parsed.data.name);
    const workspace = await prisma.workspace.create({
      data: {
        name: parsed.data.name,
        slug,
        logoUrl: parsed.data.logoUrl ?? null,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
      },
      include: { members: { include: { user: true } } },
    });

    return apiResponse(workspace, { status: 201 });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
