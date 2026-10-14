"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { staffRoles } from "@/lib/auth-roles";
import { requireUser } from "@/lib/current-user";
import { createStudent, updateStudentByStaff } from "@/lib/data/students";
import { studentDbError } from "@/lib/db-errors";
import { formResult, type FormState } from "@/lib/form-state";
import {
  studentCreateSchema,
  studentStaffSchema,
  validationError,
} from "@/lib/validation";

export async function createStudentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser(staffRoles);

  const parsed = studentCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return validationError(formData, parsed.error.flatten().fieldErrors);
  }

  try {
    await createStudent(parsed.data);
  } catch (error) {
    return studentDbError(error, formData);
  }

  revalidatePath("/estudiantes");
  redirect("/estudiantes?ok=creado");
}

export async function updateStudentAction(
  studentId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser(staffRoles);

  const parsed = studentStaffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return validationError(formData, parsed.error.flatten().fieldErrors);
  }

  let updated: boolean;
  try {
    updated = await updateStudentByStaff(studentId, parsed.data);
  } catch (error) {
    return studentDbError(error, formData);
  }
  if (!updated) {
    return formResult({ status: "error", message: "El estudiante ya no existe." });
  }

  revalidatePath("/estudiantes");
  revalidatePath(`/estudiantes/${studentId}/editar`);
  redirect("/estudiantes?ok=actualizado");
}
