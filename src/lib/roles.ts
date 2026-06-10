export const USER_ROLES = ["ENGINEER", "ANALYST", "ARCHITECT", "STAKEHOLDER"] as const;
export type AppUserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<AppUserRole, string> = {
  ENGINEER: "Engineer",
  ANALYST: "Analyst",
  ARCHITECT: "Architect",
  STAKEHOLDER: "Stakeholder",
};

export function formatUserRole(role: string | null | undefined): string {
  if (!role) return "—";
  if (role in USER_ROLE_LABELS) return USER_ROLE_LABELS[role as AppUserRole];
  return role.charAt(0) + role.slice(1).toLowerCase();
}
