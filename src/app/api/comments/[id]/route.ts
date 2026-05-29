import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return apiResponse(null, { error: "Not found", status: 404 });

    if (comment.authorId !== user.id) {
      return apiResponse(null, { error: "Forbidden", status: 403 });
    }

    await prisma.comment.delete({ where: { id } });
    return apiResponse({ deleted: true });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
