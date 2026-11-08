import { staffRoles } from "@/lib/auth-roles";
import { fail, handler, ok, readJson, requireApiUser } from "@/lib/api/http";
import { listApprovedWithoutTribunal, listTribunals } from "@/lib/data/tribunals";
import { assignTribunal } from "@/lib/services/staff";

/** Convocatorias registradas y temas aprobados que esperan tribunal. */
export const GET = handler(async (request: Request) => {
  const user = await requireApiUser(request, staffRoles);
  if (user instanceof Response) return user;
  const [tribunals, candidates] = await Promise.all([listTribunals(), listApprovedWithoutTribunal()]);
  return ok({ tribunals, candidates });
});

export const POST = handler(async (request: Request) => {
  const user = await requireApiUser(request, staffRoles);
  if (user instanceof Response) return user;
  const result = await assignTribunal(user, await readJson(request));
  return result.ok ? ok({ ok: true }, 201) : fail(result);
});
