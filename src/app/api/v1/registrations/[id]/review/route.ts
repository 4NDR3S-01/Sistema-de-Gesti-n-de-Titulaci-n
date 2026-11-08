import { staffRoles } from "@/lib/auth-roles";
import { fail, handler, ok, readJson, requireApiUser } from "@/lib/api/http";
import { review } from "@/lib/services/staff";

/** Decisión: { "decision": "APPROVED" | "RETURNED", "observations": "..." } */
export const POST = handler(async (request: Request, ctx: RouteContext<"/api/v1/registrations/[id]/review">) => {
  const user = await requireApiUser(request, staffRoles);
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  const result = await review(user, Number(id), await readJson(request));
  return result.ok ? ok(result.data) : fail(result);
});
