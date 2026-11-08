import { staffRoles } from "@/lib/auth-roles";
import { handler, ok, requireApiUser } from "@/lib/api/http";
import { countRegistrationsByStatus, listRegistrations, recentEvents } from "@/lib/data/pat";
import { listApprovedWithoutTribunal, listTribunals } from "@/lib/data/tribunals";

/** Resumen del panel de secretaría. */
export const GET = handler(async (request: Request) => {
  const user = await requireApiUser(request, staffRoles);
  if (user instanceof Response) return user;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" }).format(new Date());
  const [counts, pending, withoutTribunal, tribunals, activity] = await Promise.all([
    countRegistrationsByStatus(),
    listRegistrations({ status: "PENDING" }),
    listApprovedWithoutTribunal(),
    listTribunals(),
    recentEvents(8),
  ]);
  return ok({
    counts,
    waitingTribunal: withoutTribunal.length,
    pending: pending.rows.slice(0, 5),
    upcoming: tribunals.filter((row) => row.defense_date >= today).slice(0, 5),
    activity,
  });
});
