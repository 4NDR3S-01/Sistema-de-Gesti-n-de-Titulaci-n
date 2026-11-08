import { staffRoles } from "@/lib/auth-roles";
import { fail, handler, ok, requireApiUser } from "@/lib/api/http";
import { getPatDetail } from "@/lib/data/pat";

/** Detalle de un registro para revisión (los borradores son privados de los estudiantes). */
export const GET = handler(async (request: Request, ctx: RouteContext<"/api/v1/registrations/[id]">) => {
  const user = await requireApiUser(request, staffRoles);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  const detail = await getPatDetail(Number(id));
  if (!detail || detail.registration.status === "DRAFT") {
    return fail({ status: 404, code: "not_found", message: "Registro no encontrado." });
  }
  return ok(detail);
});
