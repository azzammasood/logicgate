import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, getWorkspaceMember } from "@/lib/api";
import { replaceConditionsSchema } from "@/lib/validators";
import { canEdit } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const definition = await prisma.definition.findUnique({ where: { id } });
    if (!definition) {
      return apiResponse(null, { error: "Not found", status: 404 });
    }

    const member = await getWorkspaceMember(user.id, definition.workspaceId);
    if (!member || !canEdit(user, definition, member)) {
      return apiResponse(null, { error: "Forbidden", status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiResponse(null, { error: "Invalid or empty request body", status: 400 });
    }
    const parsed = replaceConditionsSchema.safeParse(body);
    if (!parsed.success) {
      return apiResponse(null, { error: parsed.error.message, status: 400 });
    }

    const conditions = await prisma.$transaction(async (tx) => {
      await tx.condition.deleteMany({ where: { definitionId: id } });
      const created = await Promise.all(
        parsed.data.conditions.map((c) =>
          tx.condition.create({
            data: {
              definitionId: id,
              order: c.order,
              connector: c.connector,
              field: c.field,
              operator: c.operator,
              value: c.value ?? null,
              valueType: c.valueType,
            },
          })
        )
      );
      return created;
    });

    return apiResponse(conditions);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
