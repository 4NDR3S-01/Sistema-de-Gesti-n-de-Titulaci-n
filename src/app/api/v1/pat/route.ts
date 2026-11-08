import { fail, handler, ok, readJson, requireApiUser } from "@/lib/api/http";
import { getPatDetailForStudent } from "@/lib/data/pat";
import { getStudentByUserId } from "@/lib/data/students";
import { getTribunalByStudent } from "@/lib/data/tribunals";
import { canSubmit, isEditable } from "@/lib/pat-rules";
import { createPat, removeDraft } from "@/lib/services/pat-student";

/** Registro PAT 2 del estudiante: estado completo para su espacio de trabajo. */
export const GET = handler(async (request: Request) => {
  const user = await requireApiUser(request, ["STUDENT"]);
  if (user instanceof Response) return user;
  const student = await getStudentByUserId(user.id);
  if (!student) {
    return fail({ status: 404, code: "no_profile", message: "Tu perfil académico aún no está registrado." });
  }
  const [detail, tribunal] = await Promise.all([getPatDetailForStudent(student.id), getTribunalByStudent(student.id)]);
  if (!detail) return ok({ registration: null, tribunal: null });

  const { registration, members, membership, scan, events, requirements } = detail;
  return ok({
    registration,
    members,
    membership,
    scan,
    events,
    requirements,
    tribunal,
    me: { studentId: student.id },
    editable: isEditable(registration.status),
    canSubmit: canSubmit(requirements),
  });
});

export const POST = handler(async (request: Request) => {
  const user = await requireApiUser(request, ["STUDENT"]);
  if (user instanceof Response) return user;
  const result = await createPat(user, await readJson(request));
  return result.ok ? ok({ ok: true }, 201) : fail(result);
});

export const DELETE = handler(async (request: Request) => {
  const user = await requireApiUser(request, ["STUDENT"]);
  if (user instanceof Response) return user;
  const result = await removeDraft(user);
  return result.ok ? ok() : fail(result);
});
