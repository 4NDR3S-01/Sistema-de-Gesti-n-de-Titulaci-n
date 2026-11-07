"use server";

import { requireUser } from "@/lib/current-user";
import { changeOwnPassword } from "@/lib/data/users";
import { formResult, type FormState } from "@/lib/form-state";
import { passwordChangeSchema } from "@/lib/validation";

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    // Nunca se devuelven contraseñas al formulario.
    return formResult({ status: "error", message: "Revisa los campos marcados.", errors: parsed.error.flatten().fieldErrors });
  }

  const result = await changeOwnPassword(user.id, parsed.data.currentPassword, parsed.data.newPassword);
  if (result === "wrong-current") {
    return formResult({ status: "error", message: "Revisa los campos marcados.", errors: { currentPassword: ["La contraseña actual no es correcta."] } });
  }
  if (result === "no-password") {
    return formResult({ status: "error", message: "Tu cuenta no usa contraseña propia." });
  }
  return formResult({ status: "success", message: "Contraseña actualizada. Úsala la próxima vez que inicies sesión." });
}
