import "server-only";
import { staffRoles } from "@/lib/auth-roles";
import type { CurrentUser } from "@/lib/current-user";
import { pgErrorCode } from "@/lib/db";
import { reviewRegistration } from "@/lib/data/pat";
import { getStudentByUserId, updateStudentSelf } from "@/lib/data/students";
import { createTribunal, deleteTribunal } from "@/lib/data/tribunals";
import { changeOwnPassword } from "@/lib/data/users";
import { failure, invalid, success, type ServiceResult } from "@/lib/services/result";
import { passwordChangeSchema, patReviewSchema, studentSelfSchema, tribunalSchema } from "@/lib/validation";

const isStaff = (user: CurrentUser) => (staffRoles as readonly string[]).includes(user.role);
const FORBIDDEN = failure(403, "forbidden", "No tienes permiso para esta acción.");

export async function review(user: CurrentUser, registrationId: number, input: Record<string, unknown>): Promise<ServiceResult<{ decision: "APPROVED" | "RETURNED" }>> {
  if (!isStaff(user)) return FORBIDDEN;
  const parsed = patReviewSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
  const done = await reviewRegistration(registrationId, user.id, parsed.data.decision, parsed.data.observations);
  if (!done) return failure(409, "already_reviewed", "Este registro ya fue revisado o no está pendiente.");
  return success({ decision: parsed.data.decision });
}

export async function assignTribunal(user: CurrentUser, input: Record<string, unknown>): Promise<ServiceResult> {
  if (!isStaff(user)) return FORBIDDEN;
  // La app envía booleanos; el esquema espera "on" como un checkbox HTML.
  const normalized = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, value === true ? "on" : value === false ? undefined : value]),
  );
  const parsed = tribunalSchema.safeParse(normalized);
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
  try {
    if (!(await createTribunal(parsed.data, user.id))) {
      return invalid({ registrationId: ["El tema de este estudiante no está aprobado."] });
    }
  } catch (error) {
    if (pgErrorCode(error) === "23505") return invalid({ registrationId: ["Este estudiante ya tiene un tribunal asignado."] });
    throw error;
  }
  return success();
}

export async function removeTribunal(user: CurrentUser, id: number): Promise<ServiceResult> {
  if (!isStaff(user)) return FORBIDDEN;
  await deleteTribunal(id, user.id);
  return success();
}

/** El estudiante actualiza sus datos personales (no su correo institucional). */
export async function updateOwnProfile(user: CurrentUser, input: Record<string, unknown>): Promise<ServiceResult> {
  if (user.role !== "STUDENT") return FORBIDDEN;
  const student = await getStudentByUserId(user.id);
  if (!student) return failure(404, "no_profile", "Tu perfil académico aún no está registrado.");
  const parsed = studentSelfSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
  try {
    await updateStudentSelf(user.id, parsed.data);
  } catch (error) {
    if (pgErrorCode(error) === "23505") return invalid({ cedula: ["Ya existe un estudiante con esa cédula."] });
    throw error;
  }
  return success();
}

export async function changePassword(user: CurrentUser, input: Record<string, unknown>): Promise<ServiceResult> {
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
  const result = await changeOwnPassword(user.id, parsed.data.currentPassword, parsed.data.newPassword);
  if (result === "wrong-current") return invalid({ currentPassword: ["La contraseña actual no es correcta."] });
  if (result === "no-password") return failure(409, "no_password", "Tu cuenta no usa contraseña propia.");
  return success();
}
