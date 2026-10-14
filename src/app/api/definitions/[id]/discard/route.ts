import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, getWorkspaceMember } from "@/lib/api";
import { canEdit } from "@/lib/permissions";
import { applyLogicSnapshot, normalizeSnapshot, definitionInclude } from "@/lib/definitions";

type Params = { params: Promise<{ id: string }> };

// Throw away autosaved draft edits: reset the definition to its latest
// published version without recording a new version.
export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const definition = await prisma.definition.findUnique({
      where: { id },
      include: definitionInclude,
    });
    if (!definition) return apiResponse(null, { error: "Not found", status: 404 });

    const member = await getWorkspaceMember(user.id, definition.workspaceId);
    if (!member || !canEdit(user, definition, member)) {
      return apiResponse(null, { error: "Forbidden", status: 403 });
    }

    if (definition.changeRequests.length > 0) {
      return apiResponse(null, {
        error: "This draft is out for review — withdraw or resolve the request first.",
        status: 409,
      });
    }

    const latest = definition.versions[0];
    if (!latest) {
      return apiResponse(null, {
        error: "Nothing published yet — there's no version to go back to.",
        status: 400,
      });
    }

    const snapshot = normalizeSnapshot(latest.snapshot, {
      definition,
      conditions: definition.conditions,
      owners: definition.owners,
    });
    await applyLogicSnapshot(id, snapshot, latest.documentation ?? null);

    return apiResponse({ discarded: true, version: latest.version });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
