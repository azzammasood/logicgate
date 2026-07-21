import { z } from "zod";

export const createDefinitionSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["METRIC", "RULE", "FILTER", "FLAG"]),
  workspaceId: z.string(),
  groupId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const updateDefinitionSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  documentation: z.string().max(20000).optional().nullable(),
  type: z.enum(["METRIC", "RULE", "FILTER", "FLAG"]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "DEPRECATED", "PENDING_REVIEW"]).optional(),
  groupId: z.string().optional().nullable(),
  ownerId: z.string().optional(),
  approverId: z.string().optional().nullable(),
  sourceTable: z.string().optional().nullable(),
  sourceValueField: z.string().optional().nullable(),
  sourceDateField: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  joins: z
    .array(
      z.object({
        table: z.string(),
        type: z.enum(["INNER", "LEFT", "RIGHT"]).default("INNER"),
        on: z.string(),
      })
    )
    .optional()
    .nullable(),
  aggregationFn: z
    .enum(["SUM", "COUNT", "AVERAGE", "DISTINCT_COUNT", "MIN", "MAX"])
    .optional()
    .nullable(),
  groupByPeriod: z
    .enum(["CALENDAR_MONTH", "FISCAL_MONTH", "WEEK", "DAY", "QUARTER", "YEAR"])
    .optional()
    .nullable(),
  dedupeBy: z.string().optional().nullable(),
  dedupeStrategy: z.enum(["KEEP_FIRST", "KEEP_LAST", "KEEP_MAX"]).optional().nullable(),
  changeDescription: z.string().optional(),
});

export const conditionSchema = z.object({
  connector: z.enum(["IF", "AND", "OR"]),
  field: z.string().min(1),
  operator: z.enum([
    "EQUALS",
    "NOT_EQUALS",
    "IN",
    "NOT_IN",
    "GREATER_THAN",
    "LESS_THAN",
    "GREATER_EQUAL",
    "LESS_EQUAL",
    "IS_NULL",
    "IS_NOT_NULL",
    "CONTAINS",
    "STARTS_WITH",
  ]),
  value: z.string().optional().nullable(),
  valueType: z.enum(["STRING", "NUMBER", "BOOLEAN", "ARRAY", "NULL"]).default("STRING"),
  order: z.number().int(),
});

export const replaceConditionsSchema = z.object({
  conditions: z.array(conditionSchema),
});

export const createChangeRequestSchema = z.object({
  definitionId: z.string(),
  proposedSnapshot: z.record(z.string(), z.unknown()),
  changeDescription: z.string().min(20),
});

export const patchChangeRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().optional(),
});

export const patchUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["ENGINEER", "ANALYST", "ARCHITECT", "STAKEHOLDER"]).optional(),
  title: z.string().max(120).optional().nullable(),
  timezone: z.string().max(64).optional(),
  about: z.string().max(2000).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  preferences: z.record(z.string(), z.unknown()).optional(),
});

export const createGroupSchema = z.object({
  name: z.string().min(1),
  workspaceId: z.string(),
  color: z.string().optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  logoUrl: z.string().url().optional().nullable(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "EDITOR", "VIEWER"]).default("VIEWER"),
});

export const createCommentSchema = z.object({
  body: z.string().min(1),
  changeRequestId: z.string().optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().max(500).nullable().optional(),
  logoUrl: z.union([z.string().url(), z.literal("")]).nullable().optional(),
  workspaceSettings: z.record(z.string(), z.unknown()).optional(),
});

