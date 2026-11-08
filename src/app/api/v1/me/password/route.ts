import { fail, handler, ok, readJson, requireApiUser } from "@/lib/api/http";
import { changePassword } from "@/lib/services/staff";

export const POST = handler(async (request: Request) => {
  const user = await requireApiUser(request);
  if (user instanceof Response) return user;
  const result = await changePassword(user, await readJson(request));
  return result.ok ? ok() : fail(result);
});
