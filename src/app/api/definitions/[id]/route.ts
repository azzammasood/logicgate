import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  requireSessionUser,
  requireWorkspaceMember,
  getWorkspaceMember,
} from "@/lib/api";
import { updateDefinitionSchema } from "@/lib/validators";
import { canEdit, canDelete } from "@/lib/permissions";
import { definitionInclude } from "@/lib/definitions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const definition = await prisma.definition.findUnique({
      where: { id },
      include: definitionInclude,
    });
    if (!definition) {
      return apiResponse(null, { error: "Not found", status: 404 });
    }

    const memberResult = await requireWorkspaceMember(user.id, definition.workspaceId);
    if ("error" in memberResult) return memberResult.error;

    return apiResponse(definition);
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

    const existing = await prisma.definition.findUnique({ where: { id } });
    if (!existing) {
      return apiResponse(null, { error: "Not found", status: 404 });
    }

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
    const parsed = updateDefinitionSchema.safeParse(body);
    if (!parsed.success) {
      return apiResponse(null, { error: parsed.error.message, status: 400 });
    }

    // Edits are saved to the working draft only. Versions are created
    // explicitly on publish (see /publish), like a git commit.
    const { changeDescription: _ignored, ...data } = parsed.data;
    void _ignored;
    const updated = await prisma.definition.update({
      where: { id },
      data,
      include: definitionInclude,
    });

    return apiResponse(updated);
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Server error";
    return apiResponse(null, {
      error: process.env.NODE_ENV === "development" ? message : "Server error",
      status: 500,
    });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const existing = await prisma.definition.findUnique({ where: { id } });
    if (!existing) {
      return apiResponse(null, { error: "Not found", status: 404 });
    }

    const member = await getWorkspaceMember(user.id, existing.workspaceId);
    if (!member || !canDelete(user, existing, member)) {
      return apiResponse(null, { error: "Forbidden", status: 403 });
    }

    const updated = await prisma.definition.update({
      where: { id },
      data: { status: "DEPRECATED" },
    });

    return apiResponse(updated);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
