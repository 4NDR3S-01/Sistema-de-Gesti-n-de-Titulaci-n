import { handler, ok, requireApiUser } from "@/lib/api/http";
import { searchTeammates } from "@/lib/data/pat";
import { getStudentByUserId } from "@/lib/data/students";

/** Compañeros disponibles (misma carrera, activos, sin registro). La cédula se enmascara. */
export const GET = handler(async (request: Request) => {
  const user = await requireApiUser(request, ["STUDENT"]);
  if (user instanceof Response) return user;
  const student = await getStudentByUserId(user.id);
  const text = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (!student || text.length < 3) return ok({ results: [] });
  const results = await searchTeammates(student.id, text);
  return ok({
    results: results.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      cedula: row.cedula ? `${row.cedula.slice(0, 3)}••••${row.cedula.slice(-3)}` : null,
    })),
  });
});
