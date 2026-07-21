import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, requireWorkspaceMember } from "@/lib/api";
import { canManageTeam } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

function settingsOf(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function generateCode(): string {
  // 32-char URL-safe hex — enough entropy that codes can't be guessed.
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

/** Returns the current invite code (admin only), or null if none set. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const memberResult = await requireWorkspaceMember(user.id, id);
    if ("error" in memberResult) return memberResult.error;
    if (!canManageTeam(user, memberResult)) {
      return apiResponse(null, { error: "Forbidden", status: 403 });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    const code = settingsOf(workspace?.workspaceSettings).inviteCode ?? null;
    return apiResponse({ inviteCode: code });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}

/** Generates (or rotates) the workspace invite code. Admin only. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const memberResult = await requireWorkspaceMember(user.id, id);
    if ("error" in memberResult) return memberResult.error;
    if (!canManageTeam(user, memberResult)) {
      return apiResponse(null, { error: "Forbidden", status: 403 });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) return apiResponse(null, { error: "Not found", status: 404 });

    const code = generateCode();
    const nextSettings = { ...settingsOf(workspace.workspaceSettings), inviteCode: code };
    await prisma.workspace.update({
      where: { id },
      data: { workspaceSettings: nextSettings as Prisma.InputJsonValue },
    });

    return apiResponse({ inviteCode: code });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}

/** Revokes the invite code so existing links stop working. Admin only. */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const memberResult = await requireWorkspaceMember(user.id, id);
    if ("error" in memberResult) return memberResult.error;
    if (!canManageTeam(user, memberResult)) {
      return apiResponse(null, { error: "Forbidden", status: 403 });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) return apiResponse(null, { error: "Not found", status: 404 });

    const nextSettings = settingsOf(workspace.workspaceSettings);
    delete nextSettings.inviteCode;
    await prisma.workspace.update({
      where: { id },
      data: { workspaceSettings: nextSettings as Prisma.InputJsonValue },
    });

    return apiResponse({ inviteCode: null });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
