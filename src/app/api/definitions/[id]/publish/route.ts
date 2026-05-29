import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, getWorkspaceMember } from "@/lib/api";
import { canEdit } from "@/lib/permissions";
import { definitionInclude } from "@/lib/definitions";
import { createVersionSnapshot } from "@/lib/versioning";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  message: z.string().trim().min(1, "A publish message is required").max(500),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const existing = await prisma.definition.findUnique({ where: { id } });
    if (!existing) return apiResponse(null, { error: "Not found", status: 404 });

    const member = await getWorkspaceMember(user.id, existing.workspaceId);
    if (!member || !canEdit(user, existing, member)) {
      return apiResponse(null, { error: "Forbidden", status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiResponse(null, { error: "Invalid or empty request body", status: 400 });
    }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return apiResponse(null, { error: parsed.error.issues[0]?.message ?? "Invalid", status: 400 });
    }

    await prisma.definition.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    // Commit-style snapshot with the user's message.
    await createVersionSnapshot(id, user.id, parsed.data.message);

    const refreshed = await prisma.definition.findUnique({
      where: { id },
      include: definitionInclude,
    });

    return apiResponse(refreshed);
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Server error";
    return apiResponse(null, {
      error: process.env.NODE_ENV === "development" ? message : "Server error",
      status: 500,
    });
  }
}
