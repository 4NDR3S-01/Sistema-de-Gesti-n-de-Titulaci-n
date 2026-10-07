export const appRoles = ["STUDENT", "SECRETARY", "ADMIN"] as const;

export type AppRole = (typeof appRoles)[number];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && appRoles.includes(value as AppRole);
}

export function getRoleLabel(role: AppRole): string {
  switch (role) {
    case "STUDENT":
      return "Estudiante";
    case "SECRETARY":
      return "Secretaría";
    case "ADMIN":
      return "Administración";
  }
}
