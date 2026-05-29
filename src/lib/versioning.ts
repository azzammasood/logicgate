import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildSnapshot, definitionInclude } from "@/lib/definitions";

export async function createVersionSnapshot(
  definitionId: string,
  changedById: string,
  changeDescription: string
) {
  const def = await prisma.definition.findUnique({
    where: { id: definitionId },
    include: definitionInclude,
  });
  if (!def) throw new Error("Definition not found");

  const nextVersion = def.currentVersion + 1;
  const snapshot = buildSnapshot(def, def.conditions, def.owners);

  try {
    await prisma.$transaction([
      prisma.definition.update({
        where: { id: definitionId },
        data: { currentVersion: nextVersion },
      }),
      prisma.definitionVersion.create({
        data: {
          definitionId,
          version: nextVersion,
          snapshot: snapshot as object,
          changeDescription,
          changedById,
        },
      }),
    ]);
    return nextVersion;
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const latest = await prisma.definition.findUnique({
        where: { id: definitionId },
        select: { currentVersion: true },
      });
      return latest?.currentVersion ?? def.currentVersion;
    }
    throw e;
  }
}
