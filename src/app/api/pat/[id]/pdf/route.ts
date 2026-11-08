import { fail, getRequestUser, handler } from "@/lib/api/http";
import { getPatDetail, isMemberUser } from "@/lib/data/pat";
import { patDocumentData } from "@/lib/pat-document-data";
import { buildPatPdf } from "@/lib/pat-pdf";

/**
 * Formato PAT-04-F-002 en PDF. ?firmas=0 lo genera sin firmas (para firmar a mano).
 * Lo pueden descargar sus integrantes (sesión web o token de la app) y el personal.
 */
export const GET = handler(async (request: Request, ctx: RouteContext<"/api/pat/[id]/pdf">) => {
  const { id } = await ctx.params;
  const registrationId = Number(id);
  const user = await getRequestUser(request);
  if (!user) return fail({ status: 401, code: "unauthorized", message: "Inicia sesión para descargar el formato." });
  if (!Number.isInteger(registrationId) || registrationId <= 0) {
    return fail({ status: 404, code: "not_found", message: "Registro no encontrado." });
  }

  const detail = await getPatDetail(registrationId);
  if (!detail) return fail({ status: 404, code: "not_found", message: "Registro no encontrado." });
  const member = await isMemberUser(registrationId, user.id);
  const staffCanSee = user.role !== "STUDENT" && detail.registration.status !== "DRAFT";
  if (!member && !staffCanSee) return fail({ status: 403, code: "forbidden", message: "No tienes acceso a este registro." });

  const withSignatures = new URL(request.url).searchParams.get("firmas") !== "0";
  const pdf = buildPatPdf(patDocumentData(detail, { withSignatures }));
  const name = `PAT-04-F-002_registro-${registrationId}${withSignatures ? "" : "_para-firmar"}.pdf`;
  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
