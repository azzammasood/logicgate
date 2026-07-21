import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, getWorkspaceMember } from "@/lib/api";
import { z } from "zod";

const bodySchema = z.object({
  workspaceId: z.string(),
  ids: z.array(z.string()).min(1),
});

/**
 * Persist a manual ordering for a set of definitions (drag-to-reorder in the
 * list rail). Assigns sortOrder = index for each id. Ordering is applied
 * per-group on the client, so collisions across groups don't matter.
 */
export async function POST(request: Request) {
  try {
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiResponse(null, { error: "Invalid request body", status: 400 });
    }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return apiResponse(null, { error: parsed.error.issues[0]?.message ?? "Invalid", status: 400 });
    }

    const member = await getWorkspaceMember(user.id, parsed.data.workspaceId);
    if (!member && user.role !== "ADMIN") {
      return apiResponse(null, { error: "Forbidden", status: 403 });
    }

    // Only reorder definitions that actually belong to this workspace.
    const owned = await prisma.definition.findMany({
      where: { id: { in: parsed.data.ids }, workspaceId: parsed.data.workspaceId },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((d) => d.id));

    await prisma.$transaction(
      parsed.data.ids
        .filter((id) => ownedIds.has(id))
        .map((id, index) =>
          prisma.definition.update({ where: { id }, data: { sortOrder: index } })
        )
    );

    return apiResponse({ ok: true });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
