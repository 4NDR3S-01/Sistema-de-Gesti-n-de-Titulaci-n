import "server-only";
import { pgConstraint, pgErrorCode } from "@/lib/db";
import { formResult, type FormState } from "@/lib/form-state";
import { formValues, validationError } from "@/lib/validation";

/** Traduce errores de unicidad o llaves foráneas a mensajes por campo. */
export function studentDbError(
  error: unknown,
  formData: FormData,
): FormState {
  const code = pgErrorCode(error);
  const constraint = pgConstraint(error) ?? "";

  if (code === "23505") {
    const field = constraint.includes("email")
      ? { email: ["Ya existe un usuario con ese correo."] }
      : constraint.includes("cedula")
        ? { cedula: ["Ya existe un estudiante con esa cédula."] }
        : constraint.includes("student_code")
          ? { studentCode: ["Ya existe un estudiante con ese código."] }
          : {};
    return validationError(formData, field);
  }
  if (code === "23503") {
    return validationError(formData, { careerId: ["La carrera seleccionada no existe."] });
  }

  console.error("Error al guardar estudiante", error);
  return formResult({
    status: "error",
    message: "No se pudo guardar la información. Inténtalo de nuevo.",
    values: formValues(formData),
  });
}
