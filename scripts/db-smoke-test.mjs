import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const runId = Date.now();
const user = await prisma.user.create({
  data: {
    email: `smoke-${runId}@logicgate.test`,
    name: "Smoke Test",
    role: "ENGINEER",
    avatarInitials: "ST",
  },
});

const workspace = await prisma.workspace.create({
  data: {
    name: "LogicGate Smoke Workspace",
    slug: `smoke-${runId}`,
    members: { create: { userId: user.id, role: "OWNER" } },
  },
});

const definition = await prisma.definition.create({
  data: {
    name: "Smoke Metric",
    slug: `smoke-metric-${runId}`,
    type: "METRIC",
    workspaceId: workspace.id,
    ownerId: user.id,
    sourceTable: "transactions",
    sourceValueField: "amount",
    owners: { create: { userId: user.id, isPrimary: true } },
    conditions: {
      create: {
        order: 0,
        connector: "IF",
        field: "status",
        operator: "EQUALS",
        value: "completed",
        valueType: "STRING",
      },
    },
    versions: {
      create: {
        version: 1,
        snapshot: {},
        changeDescription: "Initial",
        changedById: user.id,
      },
    },
  },
  include: { conditions: true },
});

console.log("✓ User", user.id);
console.log("✓ Workspace", workspace.slug);
console.log("✓ Definition", definition.id, "conditions:", definition.conditions.length);

await prisma.definition.delete({ where: { id: definition.id } });
await prisma.workspace.delete({ where: { id: workspace.id } });
await prisma.user.delete({ where: { id: user.id } });

console.log("✓ Cleanup done");
await prisma.$disconnect();
await pool.end();
