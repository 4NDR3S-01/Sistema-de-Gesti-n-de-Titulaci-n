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
  .string({ required_error: "Ingresa el correo institucional." })
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

const mobileRequired = z
  .string({ required_error: "Ingresa el celular." })
  .trim()
  .regex(/^09\d{8}$/, "El celular debe tener 10 dígitos y empezar con 09.");

const sexField = z.enum(["MASCULINO", "FEMENINO"], {
  errorMap: () => ({ message: "Selecciona el sexo." }),
});

const personalEmailField = z
  .string({ required_error: "Ingresa el correo personal." })
  .trim()
  .toLowerCase()
  .max(150, "El correo no puede superar 150 caracteres.")
  .email("Ingresa un correo personal válido.");

const addressField = z
  .string({ required_error: "Ingresa el domicilio." })
  .trim()
  .min(5, "El domicilio debe tener al menos 5 caracteres.")
  .max(200, "El domicilio no puede superar 200 caracteres.");

const landlineField = z
  .string({ required_error: "Ingresa el teléfono." })
  .trim()
  .regex(/^\d{7,10}$/, "El teléfono debe tener entre 7 y 10 dígitos, sin espacios.");

const curriculumChangesField = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({ invalid_type_error: "Ingresa un número válido." })
    .int("Ingresa un número entero.")
    .min(0, "El número de cambio de malla no puede ser negativo.")
    .max(20, "El número de cambio de malla no puede superar 20.")
    .optional(),
);

/** Campo obligatorio: un texto vacío cuenta como faltante y muestra su `required_error`. */
const required = <T extends z.ZodTypeAny>(field: T) => z.preprocess(emptyToUndefined, field);

/** Campos del formulario institucional; en el registro por secretaría son opcionales. */
const optional = <T extends z.ZodTypeAny>(field: T) =>
  z.preprocess(emptyToUndefined, field.optional());

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
  sex: optional(sexField),
  personalEmail: optional(personalEmailField),
  address: optional(addressField),
  landline: optional(landlineField),
  curriculumChanges: curriculumChangesField,
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

/**
 * Datos que el estudiante actualiza por sí mismo (formulario institucional).
 * Todos son obligatorios salvo el número de cambio de malla; carrera, facultad,
 * semestre y año de ingreso los gestiona secretaría.
 */
export const studentSelfSchema = z.object({
  cedula: required(studentStaffSchema.shape.cedula),
  name: required(personName("los nombres")),
  lastname: required(personName("los apellidos")),
  email: required(emailField),
  sex: required(sexField),
  personalEmail: required(personalEmailField),
  address: required(addressField),
  landline: required(landlineField),
  phone: required(mobileRequired),
  curriculumChanges: curriculumChangesField,
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
