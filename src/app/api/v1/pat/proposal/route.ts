import { fail, handler, ok, readJson, requireApiUser } from "@/lib/api/http";
import { editProposal } from "@/lib/services/pat-student";

export const PUT = handler(async (request: Request) => {
  const user = await requireApiUser(request, ["STUDENT"]);
  if (user instanceof Response) return user;
  const result = await editProposal(user, await readJson(request));
  return result.ok ? ok() : fail(result);
});
