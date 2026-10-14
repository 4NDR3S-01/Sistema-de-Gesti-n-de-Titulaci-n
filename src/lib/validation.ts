import { z } from "zod";
import { formResult, type FormState } from "@/lib/form-state";

/** Valida una cédula ecuatoriana (provincia, tercer dígito y dígito verificador). */
export function isValidCedula(value: string): boolean {
  if (!/^\d{10}$/.test(value)) return false;
  const province = Number(value.slice(0, 2));
  if (!((province >= 1 && province <= 24) || province === 30)) return false;
  if (Number(value[2]) >= 6) return false;

  const sum = value
    .slice(0, 9)
    .split("")
    .reduce((total, digit, index) => {
      let product = Number(digit) * (index % 2 === 0 ? 2 : 1);
      if (product > 9) product -= 9;
      return total + product;
    }, 0);
  const check = (10 - (sum % 10)) % 10;
  return check === Number(value[9]);
}

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const personName = (label: string) =>
  z
    .string({ required_error: `Ingresa ${label}.` })
    .trim()
    .min(2, `${label[0].toUpperCase()}${label.slice(1)} debe tener al menos 2 caracteres.`)
    .max(100, `${label[0].toUpperCase()}${label.slice(1)} no puede superar 100 caracteres.`)
    .regex(/^[\p{L}\s'.-]+$/u, `${label[0].toUpperCase()}${label.slice(1)} solo puede contener letras.`);

export const emailField = z
  .string({ required_error: "Ingresa el correo." })
  .trim()
  .toLowerCase()
  .max(150, "El correo no puede superar 150 caracteres.")
  .email("Ingresa un correo válido.");

const phoneField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .regex(/^09\d{8}$/, "El celular debe tener 10 dígitos y empezar con 09.")
    .optional(),
);

const passwordField = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña no puede superar 72 caracteres.");

const idField = (message: string) =>
  z.coerce.number({ invalid_type_error: message }).int(message).positive(message);

export const studentStaffSchema = z.object({
  name: personName("los nombres"),
  lastname: personName("los apellidos"),
  email: emailField,
  cedula: z
    .string({ required_error: "Ingresa la cédula." })
    .trim()
    .refine(isValidCedula, "La cédula no es válida."),
  studentCode: z
    .string({ required_error: "Ingresa el código de estudiante." })
    .trim()
    .min(3, "El código debe tener al menos 3 caracteres.")
    .max(50, "El código no puede superar 50 caracteres.")
    .regex(/^[A-Za-z0-9-]+$/, "El código solo admite letras, números y guiones."),
  careerId: idField("Selecciona una carrera."),
  semester: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ invalid_type_error: "Selecciona un semestre válido." })
      .int()
      .min(1, "El semestre debe estar entre 1 y 12.")
      .max(12, "El semestre debe estar entre 1 y 12.")
      .optional(),
  ),
  phone: phoneField,
  enrollmentYear: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ invalid_type_error: "Ingresa un año válido." })
      .int("Ingresa un año válido.")
      .min(1990, "El año de ingreso no puede ser anterior a 1990.")
      .max(new Date().getFullYear(), "El año de ingreso no puede ser futuro.")
      .optional(),
  ),
});

export const studentCreateSchema = studentStaffSchema.extend({
  password: passwordField,
});

export const studentSelfSchema = z.object({
  email: emailField,
  phone: phoneField,
});

const staffRoleField = z.enum(["ADMIN", "SECRETARY"], {
  errorMap: () => ({ message: "Selecciona un rol válido." }),
});

export const userCreateSchema = z.object({
  name: personName("los nombres"),
  lastname: personName("los apellidos"),
  email: emailField,
  role: staffRoleField,
  password: passwordField,
});

export const userUpdateSchema = z.object({
  name: personName("los nombres"),
  lastname: personName("los apellidos"),
  email: emailField,
  role: z.preprocess(emptyToUndefined, staffRoleField.optional()),
  password: z.preprocess(emptyToUndefined, passwordField.optional()),
});

export const facultySchema = z.object({
  name: z
    .string({ required_error: "Ingresa el nombre de la facultad." })
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(150, "El nombre no puede superar 150 caracteres."),
});

export const careerSchema = z.object({
  name: z
    .string({ required_error: "Ingresa el nombre de la carrera." })
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(150, "El nombre no puede superar 150 caracteres."),
  facultyId: idField("Selecciona una facultad."),
});

/** Valores enviados (sin contraseñas) para volver a llenar el formulario tras un error. */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$") && key !== "password") {
      values[key] = value;
    }
  }
  return values;
}

export function validationError(
  formData: FormData,
  errors: Record<string, string[] | undefined>,
): FormState {
  return formResult({
    status: "error",
    message: "Revisa los campos marcados.",
    errors,
    values: formValues(formData),
  });
}
