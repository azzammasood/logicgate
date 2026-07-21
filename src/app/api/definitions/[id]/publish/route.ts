import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, getWorkspaceMember } from "@/lib/api";
import { canEdit, canApprove } from "@/lib/permissions";
import { definitionInclude } from "@/lib/definitions";
import { createVersionSnapshot } from "@/lib/versioning";
import { firePublishWebhook } from "@/lib/integrations";
import type { WorkspaceSettings } from "@/types";
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

    // Workspace workflow policy (Configuration → Workflow).
    const workspace = await prisma.workspace.findUnique({
      where: { id: existing.workspaceId },
    });
    const settings = (workspace?.workspaceSettings ?? {}) as WorkspaceSettings;

    if (settings.requireChangeReason && parsed.data.message.trim().length < 20) {
      return apiResponse(null, {
        error:
          "This workspace requires a change reason of at least 20 characters when publishing.",
        status: 400,
      });
    }

    // When approval is required, reviewers/approvers may still publish directly;
    // everyone else must route changes through the change-request flow.
    if (settings.requireApprovalForPublish && !canApprove(user, existing, member)) {
      return apiResponse(null, {
        error:
          "This workspace requires approval before publishing. Open a change request for review instead.",
        status: 403,
      });
    }

    await prisma.definition.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    // Commit-style snapshot with the user's message.
    const version = await createVersionSnapshot(id, user.id, parsed.data.message);

    const refreshed = await prisma.definition.findUnique({
      where: { id },
      include: definitionInclude,
    });

    if (refreshed) {
      await firePublishWebhook(existing.workspaceId, {
        definition: {
          id: refreshed.id,
          name: refreshed.name,
          type: refreshed.type,
          status: refreshed.status,
          version,
        },
        message: parsed.data.message,
      });
    }

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
