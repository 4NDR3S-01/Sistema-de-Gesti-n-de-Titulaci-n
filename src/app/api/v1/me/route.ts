import { getRoleLabel } from "@/lib/auth-roles";
import { handler, ok, requireApiUser } from "@/lib/api/http";
import { getNotifications } from "@/lib/data/notifications";
import { getStudentByUserId } from "@/lib/data/students";
import { hasLocalPassword } from "@/lib/data/users";

/** Usuario actual, su ficha (si es estudiante) y lo que requiere su atención. */
export const GET = handler(async (request: Request) => {
  const user = await requireApiUser(request);
  if (user instanceof Response) return user;
  const [student, notifications, withPassword] = await Promise.all([
    user.role === "STUDENT" ? getStudentByUserId(user.id) : null,
    getNotifications(user),
    hasLocalPassword(user.id),
  ]);
  return ok({ user: { ...user, roleLabel: getRoleLabel(user.role), hasPassword: withPassword }, student, notifications });
});
