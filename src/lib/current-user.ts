import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { query } from "@/lib/db";
import { isAppRole, type AppRole } from "@/lib/auth-roles";

export type CurrentUser = {
  id: number;
  name: string;
  lastname: string;
  email: string;
  role: AppRole;
};

/**
 * Usuario de la sesión, leído de la base en cada solicitud para que una
 * cuenta desactivada o un cambio de rol se apliquen de inmediato.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const id = Number(session?.user?.id);
  if (!Number.isInteger(id) || id <= 0) return null;

  const [row] = await query<{
    id: number;
    name: string;
    lastname: string;
    email: string;
    role: string;
  }>(
    `SELECT u.id, u.name, u.lastname, u.email, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1 AND u.is_active`,
    [id],
  );
  if (!row || !isAppRole(row.role)) return null;
  return { ...row, role: row.role };
});

/** Exige sesión (y opcionalmente un rol); si no, redirige. Úsalo también en cada Server Action. */
export async function requireUser(
  roles?: readonly AppRole[],
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (roles && !roles.includes(user.role)) redirect("/panel");
  return user;
}
