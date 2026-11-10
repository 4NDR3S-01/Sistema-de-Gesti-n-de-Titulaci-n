import { fail, handler, issueToken, ok, readJson, requireApiUser } from "@/lib/api/http";
import { changePassword } from "@/lib/services/staff";

/**
 * Cambia la contraseña. Los tokens emitidos antes quedan revocados; si la
 * solicitud viene de la app (Bearer), se devuelve un token nuevo para este dispositivo.
 */
export const POST = handler(async (request: Request) => {
  const user = await requireApiUser(request);
  if (user instanceof Response) return user;
  const result = await changePassword(user, await readJson(request));
  if (!result.ok) return fail(result);
  if (request.headers.get("authorization")?.startsWith("Bearer ")) {
    const { token, expiresAt } = await issueToken(user.id);
    return ok({ ok: true, token, expiresAt });
  }
  return ok();
});
