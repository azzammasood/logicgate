import {
  createDefinitionSchema,
  replaceConditionsSchema,
  createChangeRequestSchema,
} from "./validators";

describe("validators", () => {
  it("createDefinitionSchema valid", () => {
    const r = createDefinitionSchema.safeParse({
      name: "Revenue",
      type: "METRIC",
      workspaceId: "ws1",
    });
    expect(r.success).toBe(true);
  });

  it("createDefinitionSchema rejects short name", () => {
    const r = createDefinitionSchema.safeParse({
      name: "A",
      type: "METRIC",
      workspaceId: "ws1",
    });
    expect(r.success).toBe(false);
  });

  it("replaceConditionsSchema", () => {
    const r = replaceConditionsSchema.safeParse({
      conditions: [
        {
          connector: "IF",
          field: "status",
          operator: "EQUALS",
          value: "ok",
          valueType: "STRING",
          order: 0,
        },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("createChangeRequestSchema min description", () => {
    const r = createChangeRequestSchema.safeParse({
      definitionId: "d1",
      proposedSnapshot: {},
      changeDescription: "short",
    });
    expect(r.success).toBe(false);
  });
});
