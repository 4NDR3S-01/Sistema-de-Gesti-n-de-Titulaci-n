import { fail, getRequestUser, handler } from "@/lib/api/http";
import { getPatDetail, getScanFile, isMemberUser } from "@/lib/data/pat";

/**
 * Formato escaneado. Mismas reglas que el PDF (../pdf/route.ts): lo ven sus integrantes
 * (sesión web o token de la app) y el personal, este último solo si ya no es un borrador.
 */
export const GET = handler(async (request: Request, ctx: RouteContext<"/api/pat/[id]/escaneado">) => {
  const { id } = await ctx.params;
  const registrationId = Number(id);
  const user = await getRequestUser(request);
  if (!user) return fail({ status: 401, code: "unauthorized", message: "Inicia sesión para ver el formato." });
  if (!Number.isInteger(registrationId) || registrationId <= 0) {
    return fail({ status: 404, code: "not_found", message: "Registro no encontrado." });
  }

  const detail = await getPatDetail(registrationId);
  if (!detail) return fail({ status: 404, code: "not_found", message: "Registro no encontrado." });
  const member = await isMemberUser(registrationId, user.id);
  const staffCanSee = user.role !== "STUDENT" && detail.registration.status !== "DRAFT";
  if (!member && !staffCanSee) return fail({ status: 403, code: "forbidden", message: "No tienes acceso a este registro." });

  const file = await getScanFile(registrationId);
  if (!file) return fail({ status: 404, code: "not_found", message: "Este registro no tiene formato escaneado." });

  const safeName = file.file_name.replace(/[^\w.\- ]+/g, "_");
  return new Response(new Uint8Array(file.content), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
