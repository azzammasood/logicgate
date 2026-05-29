import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, requireWorkspaceMember } from "@/lib/api";
import { createCommentSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const definition = await prisma.definition.findUnique({ where: { id } });
    if (!definition) return apiResponse(null, { error: "Not found", status: 404 });

    const memberResult = await requireWorkspaceMember(user.id, definition.workspaceId);
    if ("error" in memberResult) return memberResult.error;

    const comments = await prisma.comment.findMany({
      where: { definitionId: id },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });

    return apiResponse(comments);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const definition = await prisma.definition.findUnique({ where: { id } });
    if (!definition) return apiResponse(null, { error: "Not found", status: 404 });

    const memberResult = await requireWorkspaceMember(user.id, definition.workspaceId);
    if ("error" in memberResult) return memberResult.error;

    const parsed = createCommentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiResponse(null, { error: parsed.error.message, status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        definitionId: id,
        authorId: user.id,
        body: parsed.data.body,
        changeRequestId: parsed.data.changeRequestId ?? null,
      },
      include: { author: true },
    });

    return apiResponse(comment, { status: 201 });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
