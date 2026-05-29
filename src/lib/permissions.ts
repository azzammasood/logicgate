import type { Definition, User, WorkspaceMember } from "@prisma/client";

type UserRole = "ADMIN" | "ENGINEER" | "STAKEHOLDER";
type UserWithRole = { id: string; role: UserRole };
type MemberWithRole = Pick<WorkspaceMember, "role">;
type DefinitionWithOwner = Pick<Definition, "ownerId" | "approverId">;

export function canEdit(
  user: UserWithRole,
  definition: DefinitionWithOwner,
  member?: MemberWithRole | null
): boolean {
  if (user.role === "ADMIN") return true;
  if (member?.role === "OWNER" || member?.role === "EDITOR") {
    if (user.role === "ENGINEER") return true;
    if (user.role === "STAKEHOLDER") {
      return definition.ownerId === user.id;
    }
  }
  return false;
}

export function canApprove(
  user: UserWithRole,
  definition: DefinitionWithOwner,
  member?: MemberWithRole | null
): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "ENGINEER") return true;
  if (member?.role === "OWNER") return true;
  if (definition.approverId === user.id) return true;
  return false;
}

export function canDelete(
  user: UserWithRole,
  _definition: DefinitionWithOwner,
  member?: MemberWithRole | null
): boolean {
  if (user.role === "ADMIN") return true;
  return member?.role === "OWNER";
}

export function canManageTeam(
  user: UserWithRole,
  member?: MemberWithRole | null
): boolean {
  if (user.role === "ADMIN") return true;
  return member?.role === "OWNER";
}

export function canCreateDefinition(user: UserWithRole, member?: MemberWithRole | null): boolean {
  if (user.role === "ADMIN" || user.role === "ENGINEER") return true;
  return member?.role === "OWNER" || member?.role === "EDITOR";
}

export function isViewer(member?: MemberWithRole | null): boolean {
  return member?.role === "VIEWER";
}

