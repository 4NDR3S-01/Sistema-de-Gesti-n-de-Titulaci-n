import { staffRoles } from "@/lib/auth-roles";
import { fail, handler, ok, requireApiUser } from "@/lib/api/http";
import { removeTribunal } from "@/lib/services/staff";

export const DELETE = handler(async (request: Request, ctx: RouteContext<"/api/v1/tribunals/[id]">) => {
  const user = await requireApiUser(request, staffRoles);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  const result = await removeTribunal(user, Number(id));
  return result.ok ? ok() : fail(result);
});
