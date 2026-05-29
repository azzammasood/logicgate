import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  formatZodError,
  requireSessionUser,
  requireWorkspaceMember,
  slugify,
  getWorkspaceMember,
} from "@/lib/api";
import { createDefinitionSchema } from "@/lib/validators";
import { canCreateDefinition } from "@/lib/permissions";
import { buildSnapshot, definitionInclude } from "@/lib/definitions";

export async function GET(request: Request) {
  try {
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) {
      return apiResponse(null, { error: "workspaceId required", status: 400 });
    }

    const memberResult = await requireWorkspaceMember(user.id, workspaceId);
    if ("error" in memberResult) return memberResult.error;

    const groupId = searchParams.get("groupId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const definitions = await prisma.definition.findMany({
      where: {
        workspaceId,
        ...(groupId ? { groupId } : {}),
        ...(status ? { status: status as "DRAFT" | "PUBLISHED" | "DEPRECATED" | "PENDING_REVIEW" } : {}),
        ...(search
          ? { name: { contains: search, mode: "insensitive" } }
          : {}),
      },
      include: {
        group: true,
        owner: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return apiResponse(definitions);
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
    const parsed = createDefinitionSchema.safeParse(body);
    if (!parsed.success) {
      return apiResponse(null, { error: formatZodError(parsed.error), status: 400 });
    }

    const member = await getWorkspaceMember(user.id, parsed.data.workspaceId);
    if (!member || !canCreateDefinition(user, member)) {
      return apiResponse(null, { error: "Forbidden", status: 403 });
    }

    const slug = slugify(parsed.data.name);
    const definition = await prisma.definition.create({
      data: {
        name: parsed.data.name,
        slug,
        type: parsed.data.type,
        workspaceId: parsed.data.workspaceId,
        groupId: parsed.data.groupId ?? null,
        description: parsed.data.description ?? null,
        ownerId: user.id,
        owners: {
          create: { userId: user.id, isPrimary: true },
        },
      },
      include: definitionInclude,
    });

    const snapshot = buildSnapshot(definition, [], definition.owners);
    await prisma.definitionVersion.create({
      data: {
        definitionId: definition.id,
        version: 1,
        snapshot: snapshot as object,
        changeDescription: "Initial version",
        changedById: user.id,
      },
    });

    return apiResponse(definition, { status: 201 });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}

