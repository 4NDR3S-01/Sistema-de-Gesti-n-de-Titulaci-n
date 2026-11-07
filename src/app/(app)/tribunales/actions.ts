"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { staffRoles } from "@/lib/auth-roles";
import { requireUser } from "@/lib/current-user";
import { createTribunal, deleteTribunal } from "@/lib/data/tribunals";
import { pgErrorCode } from "@/lib/db";
import { formResult, type FormState } from "@/lib/form-state";
import { formValues, tribunalSchema, validationError } from "@/lib/validation";

export async function createTribunalAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(staffRoles);

  const parsed = tribunalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return validationError(formData, parsed.error.flatten().fieldErrors);
  }

  try {
    const created = await createTribunal(parsed.data, user.id);
    if (!created) {
      return validationError(formData, {
        registrationId: ["El tema de este estudiante no está aprobado."],
      });
    }
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      return validationError(formData, {
        registrationId: ["Este estudiante ya tiene un tribunal asignado."],
      });
    }
    console.error("Error al guardar tribunal", error);
    return formResult({
      status: "error",
      message: "No se pudo guardar el tribunal. Inténtalo de nuevo.",
      values: formValues(formData),
    });
  }

  revalidatePath("/tribunales");
  revalidatePath("/panel");
  redirect("/tribunales?ok=asignado");
}

export async function deleteTribunalAction(id: number): Promise<void> {
  const user = await requireUser(staffRoles);
  await deleteTribunal(id, user.id);
  revalidatePath("/tribunales");
  revalidatePath("/panel");
  redirect("/tribunales?ok=eliminado");
}
