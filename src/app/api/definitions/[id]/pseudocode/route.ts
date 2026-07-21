import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, requireWorkspaceMember } from "@/lib/api";
import { compile, type CompileFormat } from "@/lib/compiler";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const userResult = await requireSessionUser();
    if ("error" in userResult) return userResult.error;
    const user = userResult;

    const definition = await prisma.definition.findUnique({
      where: { id },
      include: { conditions: { orderBy: { order: "asc" } } },
    });
    if (!definition) {
      return apiResponse(null, { error: "Not found", status: 404 });
    }

    const memberResult = await requireWorkspaceMember(user.id, definition.workspaceId);
    if ("error" in memberResult) return memberResult.error;

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") ?? "generic") as CompileFormat;

    const code = compile(
      {
        definition: {
          name: definition.name,
          sourceTable: definition.sourceTable,
          sourceValueField: definition.sourceValueField,
          sourceDateField: definition.sourceDateField,
          joins: (definition.joins ?? null) as
            | { table: string; type: string; on: string }[]
            | null,
          aggregationFn: definition.aggregationFn,
          groupByPeriod: definition.groupByPeriod,
          dedupeBy: definition.dedupeBy,
          dedupeStrategy: definition.dedupeStrategy,
        },
        conditions: definition.conditions,
      },
      format
    );

    return apiResponse({ code, format, compiledAt: new Date().toISOString() });
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
