import type {
  Definition,
  Condition,
  DefinitionGroup,
  User,
  ChangeRequest,
  DefinitionVersion,
  Comment,
} from "@prisma/client";

export type DefinitionWithRelations = Definition & {
  conditions: Condition[];
  group: DefinitionGroup | null;
  owner: User;
  approver: User | null;
  changeRequests: (ChangeRequest & { requestedBy: User })[];
  versions: DefinitionVersion[];
};

export type ApiDefinition = Definition & {
  group?: DefinitionGroup | null;
  owner?: User;
};

export type PseudocodeResponse = {
  code: string;
  format: string;
  compiledAt: string;
};

export type WorkspaceSettings = {
  requireChangeReason?: boolean;
  requireApprovalForPublish?: boolean;
  defaultApproverId?: string;
  sourceTables?: { name: string; description?: string; columns: string[] }[];
  webhookUrl?: string;
  dbtProjectUrl?: string;
};

export type { Comment, ChangeRequest, DefinitionVersion };

