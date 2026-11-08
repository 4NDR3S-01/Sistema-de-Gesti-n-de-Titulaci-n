import { staffRoles } from "@/lib/auth-roles";
import { handler, ok, requireApiUser } from "@/lib/api/http";
import { countRegistrationsByStatus, listRegistrations } from "@/lib/data/pat";
import { PAGE_SIZE } from "@/lib/data/users";

/** Bandeja de registros enviados: ?estado=PENDING|RETURNED|APPROVED&q=&pagina= */
export const GET = handler(async (request: Request) => {
  const user = await requireApiUser(request, staffRoles);
  if (user instanceof Response) return user;
  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Number(params.get("pagina")) || 1);
  const [{ rows, total }, counts] = await Promise.all([
    listRegistrations({
      status: params.get("estado") ?? undefined,
      search: params.get("q")?.trim() || undefined,
      page,
    }),
    countRegistrationsByStatus(),
  ]);
  return ok({ rows, total, page, pageSize: PAGE_SIZE, counts });
});
