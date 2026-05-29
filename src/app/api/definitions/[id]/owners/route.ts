import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  requireSessionUser,
  getWorkspaceMember,
  getInitials,
} from "@/lib/api";
import { canEdit } from "@/lib/permissions";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  ownerIds: z.array(z.string()).default([]),
  emails: z.array(z.string().email()).default([]),
  approverId: z.string().nullable().optional(),
});

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const definition = await prisma.definition.findUnique({ where: { id } });
    if (!definition) return apiResponse(null, { error: "Not found", status: 404 });

    const member = await getWorkspaceMember(user.id, definition.workspaceId);
    if (!member || !canEdit(user, definition, member)) {
      return apiResponse(null, { error: "Forbidden", status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiResponse(null, { error: "Invalid request body", status: 400 });
    }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return apiResponse(null, { error: parsed.error.message, status: 400 });
    }

    const userIds = new Set<string>(parsed.data.ownerIds);

    // Resolve emails to users (find or create), ensure workspace membership.
    for (const rawEmail of parsed.data.emails) {
      const email = rawEmail.trim().toLowerCase();
      if (!email) continue;
      let u = await prisma.user.findUnique({ where: { email } });
      if (!u) {
        const name = email.split("@")[0];
        u = await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            email,
            name,
            avatarInitials: getInitials(name),
            role: "STAKEHOLDER",
          },
        });
      }
      await prisma.workspaceMember.upsert({
        where: { userId_workspaceId: { userId: u.id, workspaceId: definition.workspaceId } },
        create: { userId: u.id, workspaceId: definition.workspaceId, role: "VIEWER" },
        update: {},
      });
      userIds.add(u.id);
    }

    const ids = Array.from(userIds);
    if (ids.length === 0) {
      return apiResponse(null, { error: "At least one owner is required", status: 400 });
    }

    const primary = ids[0];

    await prisma.$transaction([
      prisma.definitionOwner.deleteMany({ where: { definitionId: id } }),
      prisma.definitionOwner.createMany({
        data: ids.map((uid) => ({ definitionId: id, userId: uid, isPrimary: uid === primary })),
      }),
      prisma.definition.update({
        where: { id },
        data: {
          ownerId: primary,
          approverId: parsed.data.approverId ?? null,
        },
      }),
    ]);

    const refreshed = await prisma.definition.findUnique({
      where: { id },
      include: {
        owners: { include: { user: { select: { id: true, name: true, email: true, avatarInitials: true } } } },
        approver: true,
      },
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
