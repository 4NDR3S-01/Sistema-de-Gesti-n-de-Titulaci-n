import { fail, handler, ok, requireApiUser } from "@/lib/api/http";
import { removeScan, uploadScan } from "@/lib/services/pat-student";

/** Sube el formato firmado a mano y escaneado (campo "scan", PDF de hasta 5 MB). */
export const POST = handler(async (request: Request) => {
  const user = await requireApiUser(request, ["STUDENT"]);
  if (user instanceof Response) return user;
  let file: FormDataEntryValue | null = null;
  try {
    file = (await request.formData()).get("scan");
  } catch {
    /* cuerpo inválido */
  }
  if (!(file instanceof File)) {
    return fail({ status: 422, code: "validation", message: "Selecciona el archivo PDF escaneado.", fields: { scan: ["Selecciona el archivo PDF escaneado."] } });
  }
  const result = await uploadScan(user, file.name, Buffer.from(await file.arrayBuffer()));
  return result.ok ? ok() : fail(result);
});

export const DELETE = handler(async (request: Request) => {
  const user = await requireApiUser(request, ["STUDENT"]);
  if (user instanceof Response) return user;
  const result = await removeScan(user);
  return result.ok ? ok() : fail(result);
});
