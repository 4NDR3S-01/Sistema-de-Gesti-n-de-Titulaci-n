import { fail, handler, ok, readJson, requireApiUser } from "@/lib/api/http";
import { updateOwnProfile } from "@/lib/services/staff";

/** El estudiante actualiza sus datos personales (no su correo institucional). */
export const PUT = handler(async (request: Request) => {
  const user = await requireApiUser(request, ["STUDENT"]);
  if (user instanceof Response) return user;
  const result = await updateOwnProfile(user, await readJson(request));
  return result.ok ? ok() : fail(result);
});
