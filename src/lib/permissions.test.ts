import { canEdit, canApprove, canDelete, canManageTeam, canCreateDefinition } from "./permissions";

const admin = { id: "1", role: "ADMIN" as const };
const engineer = { id: "2", role: "ENGINEER" as const };
const stakeholder = { id: "3", role: "STAKEHOLDER" as const };
const viewer = { id: "4", role: "STAKEHOLDER" as const };

const def = { ownerId: "3", approverId: "2" };
const ownerMember = { role: "OWNER" as const };
const editorMember = { role: "EDITOR" as const };
const viewerMember = { role: "VIEWER" as const };

describe("permissions", () => {
  it("ADMIN can do everything", () => {
    expect(canEdit(admin, def)).toBe(true);
    expect(canApprove(admin, def)).toBe(true);
    expect(canDelete(admin, def, ownerMember)).toBe(true);
    expect(canManageTeam(admin, ownerMember)).toBe(true);
    expect(canCreateDefinition(admin)).toBe(true);
  });

  it("ENGINEER can edit and approve but not manage team", () => {
    expect(canEdit(engineer, def, editorMember)).toBe(true);
    expect(canApprove(engineer, def)).toBe(true);
    expect(canDelete(engineer, def, editorMember)).toBe(false);
    expect(canManageTeam(engineer, editorMember)).toBe(false);
    expect(canCreateDefinition(engineer)).toBe(true);
  });

  it("STAKEHOLDER can edit own definition only", () => {
    expect(canEdit(stakeholder, def, editorMember)).toBe(true);
    expect(canEdit(stakeholder, { ...def, ownerId: "99" }, editorMember)).toBe(false);
    expect(canApprove(stakeholder, def)).toBe(false);
    expect(canCreateDefinition(stakeholder, viewerMember)).toBe(false);
  });

  it("VIEWER cannot edit", () => {
    expect(canEdit(viewer, def, viewerMember)).toBe(false);
    expect(canApprove(viewer, def, viewerMember)).toBe(false);
    expect(canDelete(viewer, def, viewerMember)).toBe(false);
    expect(canManageTeam(viewer, viewerMember)).toBe(false);
  });

  it("OWNER workspace can delete and manage team", () => {
    expect(canDelete(engineer, def, ownerMember)).toBe(true);
    expect(canManageTeam(engineer, ownerMember)).toBe(true);
  });

  it("approver match", () => {
    expect(canApprove({ id: "2", role: "STAKEHOLDER" }, def)).toBe(true);
  });
});
