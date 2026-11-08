import { fail, handler, ok, readJson, requireApiUser } from "@/lib/api/http";
import { dropTeammate, invite } from "@/lib/services/pat-student";

/** Invita (o reemplaza) al compañero/a de un trabajo en pareja. */
export const POST = handler(async (request: Request) => {
  const user = await requireApiUser(request, ["STUDENT"]);
  if (user instanceof Response) return user;
  const body = await readJson(request);
  const result = await invite(user, Number(body.studentId));
  return result.ok ? ok() : fail(result);
});

export const DELETE = handler(async (request: Request) => {
  const user = await requireApiUser(request, ["STUDENT"]);
  if (user instanceof Response) return user;
  const result = await dropTeammate(user);
  return result.ok ? ok() : fail(result);
});
