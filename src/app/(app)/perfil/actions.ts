"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/current-user";
import { updateStudentSelf } from "@/lib/data/students";
import { studentDbError } from "@/lib/db-errors";
import { formResult, type FormState } from "@/lib/form-state";
import { formValues, studentSelfSchema, validationError } from "@/lib/validation";

/** El estudiante solo puede cambiar su correo y su celular. */
export async function updateOwnProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser(["STUDENT"]);

  const parsed = studentSelfSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return validationError(formData, parsed.error.flatten().fieldErrors);
  }

  try {
    await updateStudentSelf(user.id, parsed.data);
  } catch (error) {
    return studentDbError(error, formData);
  }

  revalidatePath("/perfil");
  revalidatePath("/panel");
  return formResult({
    status: "success",
    message: "Tus datos se actualizaron correctamente.",
    values: formValues(formData),
  });
}
