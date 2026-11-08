import { fail, handler, ok, readJson, requireApiUser } from "@/lib/api/http";
import { answerInvitation } from "@/lib/services/pat-student";

/** Acepta o rechaza la invitación: { "accept": true | false }. */
export const POST = handler(async (request: Request) => {
  const user = await requireApiUser(request, ["STUDENT"]);
  if (user instanceof Response) return user;
  const body = await readJson(request);
  if (typeof body.accept !== "boolean") {
    return fail({ status: 422, code: "validation", message: "Indica si aceptas la invitación." });
  }
  const result = await answerInvitation(user, body.accept);
  return result.ok ? ok() : fail(result);
});
