import { prisma } from "@/lib/prisma";
import { apiResponse, requireSessionUser, requireWorkspaceMember } from "@/lib/api";
import {
  diffLines,
  initialsOf,
  personColor,
  roleLabel,
  snapshotLines,
  versionKind,
  type DriftDefinition,
  type DriftOverlap,
  type DriftPayload,
  type DriftPerson,
  type DriftStatus,
  type DriftType,
  type DriftVersion,
} from "@/lib/drift";
import type { DefinitionSnapshot } from "@/lib/definitions";

type UserRow = {
  id: string;
  name: string;
  role: string;
  title: string | null;
  avatarInitials: string;
};

function toPerson(u: UserRow | null | undefined): DriftPerson | null {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    initials: u.avatarInitials?.trim() || initialsOf(u.name),
    role: roleLabel(u.role, u.title),
    color: personColor(u.id),
  };
}

const UNKNOWN: DriftPerson = {
  id: "unknown",
  name: "Unknown",
  initials: "?",
  role: "Member",
  color: "#8892a4",
};

const STATUS_MAP: Record<string, DriftStatus> = {
  PUBLISHED: "published",
  PENDING_REVIEW: "pending",
  DEPRECATED: "deprecated",
  DRAFT: "draft",
};

const userSelect = {
  id: true,
  name: true,
  role: true,
  title: true,
  avatarInitials: true,
} as const;

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

    const [definitions, changeRequests] = await Promise.all([
      prisma.definition.findMany({
        where: { workspaceId },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          status: true,
          updatedAt: true,
          group: { select: { name: true } },
          owner: { select: userSelect },
          conditions: {
            orderBy: { order: "asc" as const },
            select: { field: true, operator: true, value: true },
          },
          versions: {
            orderBy: { version: "asc" as const },
            select: {
              id: true,
              version: true,
              changeDescription: true,
              snapshot: true,
              createdAt: true,
              changedBy: { select: userSelect },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.changeRequest.findMany({
        where: { definition: { workspaceId } },
        select: {
          id: true,
          definitionId: true,
          status: true,
          changeDescription: true,
          proposedSnapshot: true,
          createdAt: true,
          updatedAt: true,
          requestedBy: { select: userSelect },
          reviewedBy: { select: userSelect },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // A version created by an approval carries the change request's message, so
    // the pair can be matched back up to credit the right sign-off.
    const approvedByMessage = new Map<string, (typeof changeRequests)[number]>();
    for (const cr of changeRequests) {
      if (cr.status === "APPROVED") {
        approvedByMessage.set(`${cr.definitionId}::Approved change: ${cr.changeDescription}`, cr);
      }
    }

    const drift: DriftDefinition[] = definitions.map((def) => {
      const status = STATUS_MAP[def.status] ?? "draft";
      const outputs =
        status === "deprecated" ? [] : [`${def.slug}.sql`, `${def.slug}.py`, `${def.slug}.dbt`];

      let previous: string[] = [];
      const versions: DriftVersion[] = def.versions.map((v, i) => {
        const lines = snapshotLines(v.snapshot as unknown as DefinitionSnapshot);
        const { removed, added } = diffLines(previous, lines);
        previous = lines;
        const isLatest = i === def.versions.length - 1;
        const cr = approvedByMessage.get(`${def.id}::${v.changeDescription}`);
        return {
          key: v.id,
          v: `v${v.version}`,
          date: v.createdAt.toISOString(),
          author: toPerson(v.changedBy) ?? UNKNOWN,
          approver: toPerson(cr?.reviewedBy),
          reason: v.changeDescription ?? "",
          kind: versionKind(v.version, v.changeDescription ?? "", isLatest, status),
          removed,
          added,
          outputs,
        };
      });

      // Pending change requests sit on the lane at their proposal date as the
      // change that hasn't shipped yet.
      for (const cr of changeRequests) {
        if (cr.definitionId !== def.id || cr.status !== "PENDING") continue;
        const proposed = snapshotLines(cr.proposedSnapshot as unknown as DefinitionSnapshot);
        const { removed, added } = diffLines(previous, proposed);
        versions.push({
          key: cr.id,
          v: "pending",
          date: cr.createdAt.toISOString(),
          author: toPerson(cr.requestedBy) ?? UNKNOWN,
          approver: null,
          reason: cr.changeDescription ?? "",
          kind: "pending",
          removed,
          added,
          outputs,
        });
      }

      return {
        id: def.id,
        name: def.name,
        type: def.type.toLowerCase() as DriftType,
        domain: def.group?.name ?? "ungrouped",
        owner: def.owner?.name ?? "Unassigned",
        status,
        versions,
      };
    });

    const signOffs = changeRequests
      .filter((cr) => cr.status === "APPROVED")
      .map((cr) => ({
        date: cr.updatedAt.toISOString(),
        days: Math.max(0, (cr.updatedAt.getTime() - cr.createdAt.getTime()) / 86_400_000),
      }));

    // Two live definitions filtering the same field with different values are a
    // likely disagreement — surfaced under "Worth a conversation".
    const byField = new Map<string, Map<string, Set<string>>>();
    for (const def of definitions) {
      if (def.status === "DEPRECATED") continue;
      for (const c of def.conditions) {
        if (!c.field) continue;
        const values = byField.get(c.field) ?? new Map<string, Set<string>>();
        const seen = values.get(def.name) ?? new Set<string>();
        seen.add(`${c.operator} ${c.value ?? ""}`);
        values.set(def.name, seen);
        byField.set(c.field, values);
      }
    }
    const overlaps: DriftOverlap[] = [];
    for (const [field, perDefinition] of byField) {
      if (perDefinition.size < 2) continue;
      const shapes = new Set(
        [...perDefinition.values()].map((s) => [...s].sort().join(" | "))
      );
      if (shapes.size < 2) continue;
      overlaps.push({ field, definitions: [...perDefinition.keys()] });
    }

    const payload: DriftPayload = {
      generatedAt: new Date().toISOString(),
      definitions: drift,
      signOffs,
      overlaps: overlaps.slice(0, 3),
    };

    return apiResponse(payload);
  } catch (e) {
    console.error(e);
    return apiResponse(null, { error: "Server error", status: 500 });
  }
}
