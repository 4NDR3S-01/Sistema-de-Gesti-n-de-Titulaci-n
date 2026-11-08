import { fail, handler, ok, requireApiUser } from "@/lib/api/http";
import { leave } from "@/lib/services/pat-student";

export const POST = handler(async (request: Request) => {
  const user = await requireApiUser(request, ["STUDENT"]);
  if (user instanceof Response) return user;
  const result = await leave(user);
  return result.ok ? ok() : fail(result);
});
