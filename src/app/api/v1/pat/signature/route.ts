import { fail, handler, ok, readJson, requireApiUser } from "@/lib/api/http";
import { sign, unsign } from "@/lib/services/pat-student";

/** Guarda la firma ya procesada: { "image": "data:image/png;base64,...", "method": "DRAW" | "PHOTO" }. */
export const PUT = handler(async (request: Request) => {
  const user = await requireApiUser(request, ["STUDENT"]);
  if (user instanceof Response) return user;
  const body = await readJson(request);
  const result = await sign(user, body.image, body.method);
  return result.ok ? ok() : fail(result);
});

export const DELETE = handler(async (request: Request) => {
  const user = await requireApiUser(request, ["STUDENT"]);
  if (user instanceof Response) return user;
  const result = await unsign(user);
  return result.ok ? ok() : fail(result);
});
