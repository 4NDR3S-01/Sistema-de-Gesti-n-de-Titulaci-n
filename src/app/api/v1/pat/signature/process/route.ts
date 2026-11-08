import { fail, handler, ok, requireApiUser } from "@/lib/api/http";
import { processSignature } from "@/lib/signature-processing";

const MAX_BYTES = 12 * 1024 * 1024;

/**
 * "Escanea" una firma (foto de la hoja o trazo dibujado en la app) y devuelve la
 * vista previa en PNG transparente. No guarda nada: la app confirma con PUT /pat/signature.
 */
export const POST = handler(async (request: Request) => {
  const user = await requireApiUser(request, ["STUDENT"]);
  if (user instanceof Response) return user;
  let file: FormDataEntryValue | null = null;
  try {
    file = (await request.formData()).get("image");
  } catch {
    /* cuerpo inválido */
  }
  if (!(file instanceof File) || file.size === 0) {
    return fail({ status: 422, code: "validation", message: "Envía la imagen de la firma." });
  }
  if (file.size > MAX_BYTES) {
    return fail({ status: 413, code: "too_large", message: "La foto es demasiado grande (máx. 12 MB)." });
  }
  const image = processSignature(Buffer.from(await file.arrayBuffer()));
  if (!image) {
    return fail({
      status: 422,
      code: "no_signature",
      message: "No se detectó una firma. Usa una hoja blanca, buena luz y tinta oscura.",
    });
  }
  return ok({ image });
});
