export const appRoles = ["STUDENT", "SECRETARY", "ADMIN"] as const;

export type AppRole = (typeof appRoles)[number];

/** Roles del personal que gestionan estudiantes. */
export const staffRoles = ["SECRETARY", "ADMIN"] as const satisfies readonly AppRole[];

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

/** Etiqueta para cualquier rol de la tabla roles, incluidos los que aún no tienen acceso. */
export function getDbRoleLabel(role: string): string {
  if (isAppRole(role)) return getRoleLabel(role);
  switch (role) {
    case "COORDINATOR":
      return "Coordinación";
    case "ADVISOR":
      return "Docente asesor";
    default:
      return role;
  }
}
