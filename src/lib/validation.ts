import { z } from "zod";
import { formResult, type FormState } from "@/lib/form-state";
import {
  ageFrom,
  disabilityTypes,
  ecuadorProvinces,
  maritalStatuses,
  patLevels,
  patMechanisms,
  patModalities,
  patParallels,
} from "@/lib/pat-options";
import { ALLOWED_EMAIL_DOMAINS, emailDomain, STUDENT_EMAIL_DOMAIN } from "@/lib/institution";

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

/** Correo institucional de estudiante (live.uleam.edu.ec). */
const studentEmailField = emailField.refine(
  (value) => emailDomain(value) === STUDENT_EMAIL_DOMAIN,
  `El correo del estudiante debe terminar en @${STUDENT_EMAIL_DOMAIN}.`,
);

const staffDomains = ALLOWED_EMAIL_DOMAINS.filter((domain) => domain !== STUDENT_EMAIL_DOMAIN);

/** Correo institucional del personal (uleam.edu.ec). */
const staffEmailField = emailField.refine(
  (value) => staffDomains.includes(emailDomain(value)),
  `El correo del personal debe ser institucional (@${staffDomains.join(", @")}).`,
);

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
  email: studentEmailField,
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
  email: staffEmailField,
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
      values[key] = key in values ? `${values[key]},${value}` : value;
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

const optionalText = (max: number, label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max, `${label} no puede superar ${max} caracteres.`).optional(),
  );

const oneOf = <T extends readonly [string, ...string[]]>(values: T, message: string) =>
  z.preprocess(emptyToUndefined, z.enum(values, { errorMap: () => ({ message }) }));

/** Datos informativos del formato que completa cada integrante. */
export const patPersonalSchema = z
  .object({
    level: oneOf(patLevels, "Selecciona tu nivel."),
    curso: optionalText(20, "El curso"),
    parallel: oneOf(patParallels, "Selecciona tu paralelo."),
    birthDate: z.preprocess(
      emptyToUndefined,
      z
        .string({ required_error: "Ingresa tu fecha de nacimiento." })
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresa una fecha válida.")
        .refine((value) => {
          const age = ageFrom(value);
          return age !== null && age >= 16 && age <= 90;
        }, "Revisa la fecha de nacimiento."),
    ),
    nationality: z.preprocess(
      emptyToUndefined,
      z
        .string({ required_error: "Ingresa tu nacionalidad." })
        .trim()
        .min(3, "Ingresa tu nacionalidad.")
        .max(60, "La nacionalidad no puede superar 60 caracteres."),
    ),
    maritalStatus: oneOf(maritalStatuses, "Selecciona tu estado civil."),
    votingCertificate: optionalText(30, "El certificado de votación"),
    province: oneOf(ecuadorProvinces, "Selecciona tu provincia de residencia."),
    canton: z.preprocess(
      emptyToUndefined,
      z
        .string({ required_error: "Ingresa tu cantón de residencia." })
        .trim()
        .min(3, "Ingresa tu cantón de residencia.")
        .max(80, "El cantón no puede superar 80 caracteres."),
    ),
    parish: optionalText(80, "La parroquia"),
    disabilityType: z.preprocess(
      emptyToUndefined,
      z.enum(disabilityTypes, { errorMap: () => ({ message: "Selecciona un tipo válido." }) }).optional(),
    ),
    disabilityDegree: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ invalid_type_error: "Ingresa un porcentaje válido." })
        .int("Ingresa un porcentaje entero.")
        .min(1, "El grado debe estar entre 1 y 100.")
        .max(100, "El grado debe estar entre 1 y 100.")
        .optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.disabilityType && !data.disabilityDegree) {
      ctx.addIssue({
        code: "custom",
        path: ["disabilityDegree"],
        message: "Ingresa el grado de discapacidad.",
      });
    }
  });

export type PatPersonalInput = z.infer<typeof patPersonalSchema>;

/** Propuesta compartida por los integrantes (modalidad, tema y problemática). */
export const patProposalSchema = z
  .object({
    modality: oneOf(patModalities, "Selecciona la modalidad."),
    participationType: oneOf(["INDIVIDUAL", "GRUPAL"] as const, "Selecciona el tipo de desarrollo."),
    presentationMechanism: oneOf(patMechanisms, "Selecciona el mecanismo de desarrollo."),
    requestedTutor: optionalText(150, "El nombre del tutor/a"),
    title: z.preprocess(
      emptyToUndefined,
      z
        .string({ required_error: "Ingresa el título provisional." })
        .trim()
        .min(15, "El título debe tener al menos 15 caracteres.")
        .max(255, "El título no puede superar 255 caracteres."),
    ),
    problem: z.preprocess(
      emptyToUndefined,
      z
        .string({ required_error: "Describe la problemática." })
        .trim()
        .min(80, "Describe la problemática en al menos 80 caracteres.")
        .max(4000, "La problemática no puede superar 4000 caracteres."),
    ),
    articulations: z
      .array(z.enum(["investigacion", "vinculacion", "docencia", "ninguna"]))
      .min(1, "Marca al menos una opción (o «Ninguna»)."),
  })
  .superRefine((data, ctx) => {
    if (data.articulations.includes("ninguna") && data.articulations.length > 1) {
      ctx.addIssue({
        code: "custom",
        path: ["articulations"],
        message: "«Ninguna» no se puede combinar con otras opciones.",
      });
    }
  });

export type PatProposalInput = z.infer<typeof patProposalSchema>;

/** Decisión de secretaría sobre un registro PAT 2. */
export const patReviewSchema = z
  .object({
    decision: z.enum(["APPROVED", "RETURNED"], {
      errorMap: () => ({ message: "Elige aprobar o devolver." }),
    }),
    observations: optionalText(2000, "Las observaciones"),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "RETURNED" && (!data.observations || data.observations.length < 10)) {
      ctx.addIssue({
        code: "custom",
        path: ["observations"],
        message: "Explica qué debe corregir el estudiante (mínimo 10 caracteres).",
      });
    }
  });

const memberName = (message: string) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string({ required_error: message })
      .trim()
      .min(5, "Ingresa nombres y apellidos completos.")
      .max(150, "El nombre no puede superar 150 caracteres."),
  );

/** Convocatoria y tribunal de defensa. */
export const tribunalSchema = z
  .object({
    registrationId: idField("Selecciona el estudiante."),
    defenseDate: z.preprocess(
      emptyToUndefined,
      z
        .string({ required_error: "Ingresa la fecha de la defensa." })
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresa una fecha válida."),
    ),
    defenseTime: z.preprocess(
      emptyToUndefined,
      z
        .string({ required_error: "Ingresa la hora de la defensa." })
        .regex(/^\d{2}:\d{2}$/, "Ingresa una hora válida."),
    ),
    place: z.preprocess(
      emptyToUndefined,
      z
        .string({ required_error: "Ingresa el lugar." })
        .trim()
        .min(3, "Ingresa el lugar de la defensa.")
        .max(200, "El lugar no puede superar 200 caracteres."),
    ),
    tutor: memberName("Ingresa el tutor/a."),
    president: memberName("Ingresa quién preside el tribunal."),
    memberOne: memberName("Ingresa el primer docente."),
    memberTwo: memberName("Ingresa el segundo docente."),
    confirmPresident: z.literal("on", {
      errorMap: () => ({ message: "Confirma este requisito." }),
    }),
    confirmMembers: z.literal("on", {
      errorMap: () => ({ message: "Confirma este requisito." }),
    }),
    confirmTutor: z.literal("on", {
      errorMap: () => ({ message: "Confirma este requisito." }),
    }),
  })
  .superRefine((data, ctx) => {
    const key = (value: string) => value.toLocaleLowerCase("es").replace(/\s+/g, " ");
    const members = [
      ["president", data.president],
      ["memberOne", data.memberOne],
      ["memberTwo", data.memberTwo],
    ] as const;
    const seen = new Map<string, string>();
    for (const [field, name] of members) {
      if (seen.has(key(name))) {
        ctx.addIssue({ code: "custom", path: [field], message: "Cada integrante debe ser una persona distinta." });
      }
      seen.set(key(name), field);
      if (key(name) === key(data.tutor)) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "El tutor/a participa como observador/a y no puede integrar el tribunal.",
        });
      }
    }
    const today = new Date().toISOString().slice(0, 10);
    if (data.defenseDate < today) {
      ctx.addIssue({ code: "custom", path: ["defenseDate"], message: "La fecha no puede estar en el pasado." });
    }
  });

/** Cambio de contraseña propio. */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual."),
    newPassword: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .max(72, "La contraseña no puede superar 72 caracteres.")
      .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), "Combina letras y números."),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Las contraseñas no coinciden." });
    }
    if (data.currentPassword && data.newPassword === data.currentPassword) {
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: "Debe ser distinta de la actual." });
    }
  });
