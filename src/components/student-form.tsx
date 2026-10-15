"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState, type FormState } from "@/lib/form-state";

type CareerOption = { id: number; name: string; faculty: string };

export type StudentFormValues = {
  cedula: string;
  name: string;
  lastname: string;
  email: string;
  sex: string;
  personalEmail: string;
  address: string;
  landline: string;
  phone: string;
  curriculumChanges: string;
  careerId: string;
  semester: string;
  enrollmentYear: string;
};

type Action = (state: FormState, formData: FormData) => Promise<FormState>;
type ValueOf = (name: keyof StudentFormValues) => string;
type Errors = Record<string, string[] | undefined>;

function useStudentFormState(action: Action, initial?: Partial<StudentFormValues>) {
  const [state, formAction] = useActionState(action, initialFormState);
  const value: ValueOf = (name) => state.values?.[name] ?? initial?.[name] ?? "";
  return { state, formAction, value, errors: state.errors ?? {} };
}

/**
 * Datos personales en el orden del formulario institucional.
 * `required` marca como obligatorios los campos que el estudiante debe completar.
 */
function PersonalFields({
  value,
  errors,
  required,
}: {
  value: ValueOf;
  errors: Errors;
  required: boolean;
}) {
  return (
    <fieldset className="form-group">
      <legend>Datos personales</legend>
      <div className="form-grid">
        <Field label="Cédula" name="cedula" error={errors.cedula} hint="10 dígitos, sin guiones." required>
          <input id="cedula" name="cedula" defaultValue={value("cedula")} required inputMode="numeric" pattern="\d{10}" maxLength={10} />
        </Field>
        <Field label="Nombres" name="name" error={errors.name} required>
          <input id="name" name="name" defaultValue={value("name")} required maxLength={100} autoComplete="given-name" />
        </Field>
        <Field label="Apellidos" name="lastname" error={errors.lastname} required>
          <input id="lastname" name="lastname" defaultValue={value("lastname")} required maxLength={100} autoComplete="family-name" />
        </Field>
        <Field label="Correo institucional" name="email" error={errors.email} hint="También se usa para iniciar sesión." required>
          <input id="email" name="email" type="email" defaultValue={value("email")} required maxLength={150} autoComplete="email" />
        </Field>
        <Field label="Sexo" name="sex" error={errors.sex} required={required}>
          <select id="sex" name="sex" defaultValue={value("sex")} required={required}>
            <option value="">Selecciona una opción</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
          </select>
        </Field>
        <Field label="Correo personal" name="personalEmail" error={errors.personalEmail} required={required}>
          <input id="personalEmail" name="personalEmail" type="email" defaultValue={value("personalEmail")} required={required} maxLength={150} />
        </Field>
        <Field label="Domicilio" name="address" error={errors.address} className="field-full" required={required}>
          <input id="address" name="address" defaultValue={value("address")} required={required} maxLength={200} autoComplete="street-address" />
        </Field>
        <Field label="Teléfono" name="landline" error={errors.landline} hint="Entre 7 y 10 dígitos." required={required}>
          <input id="landline" name="landline" defaultValue={value("landline")} required={required} inputMode="tel" pattern="\d{7,10}" maxLength={10} />
        </Field>
        <Field label="Celular" name="phone" error={errors.phone} hint="Ejemplo: 0991234567." required={required}>
          <input id="phone" name="phone" defaultValue={value("phone")} required={required} inputMode="tel" pattern="09\d{8}" maxLength={10} autoComplete="tel" />
        </Field>
        <Field label="Número de cambio de malla" name="curriculumChanges" error={errors.curriculumChanges} hint="Opcional.">
          <input id="curriculumChanges" name="curriculumChanges" type="number" min={0} max={20} defaultValue={value("curriculumChanges")} />
        </Field>
      </div>
    </fieldset>
  );
}

/** Registro y edición de estudiantes por secretaría o administración. */
export function StudentForm({
  action,
  careers,
  initial,
  mode,
}: {
  action: Action;
  careers: CareerOption[];
  initial?: StudentFormValues;
  mode: "create" | "edit";
}) {
  const { state, formAction, value, errors } = useStudentFormState(action, initial);
  const faculties = [...new Set(careers.map((career) => career.faculty))];

  return (
    <form className="form-card" action={formAction} key={state.submittedAt} noValidate>
      <FormMessage state={state} />

      <PersonalFields value={value} errors={errors} required={false} />

      <fieldset className="form-group">
        <legend>Datos académicos</legend>
        <div className="form-grid">
          <Field label="Carrera" name="careerId" error={errors.careerId} required>
            <select id="careerId" name="careerId" defaultValue={value("careerId")} required>
              <option value="">Selecciona una carrera</option>
              {faculties.map((faculty) => (
                <optgroup label={faculty} key={faculty}>
                  {careers
                    .filter((career) => career.faculty === faculty)
                    .map((career) => (
                      <option value={career.id} key={career.id}>
                        {career.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Semestre / nivel" name="semester" error={errors.semester}>
            <select id="semester" name="semester" defaultValue={value("semester")}>
              <option value="">Sin especificar</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((semester) => (
                <option value={semester} key={semester}>
                  {semester}.º semestre
                </option>
              ))}
            </select>
          </Field>
          <Field label="Año de ingreso" name="enrollmentYear" error={errors.enrollmentYear}>
            <input id="enrollmentYear" name="enrollmentYear" type="number" min={1990} max={new Date().getFullYear()} defaultValue={value("enrollmentYear")} />
          </Field>
        </div>
      </fieldset>

      {mode === "create" && (
        <fieldset className="form-group">
          <legend>Acceso al sistema</legend>
          <div className="form-grid">
            <Field label="Contraseña inicial" name="password" error={errors.password} hint="Mínimo 8 caracteres. Compártela de forma segura con el estudiante." required>
              <input id="password" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" />
            </Field>
          </div>
        </fieldset>
      )}

      <div className="form-actions">
        <Link className="btn btn-ghost" href="/estudiantes">
          Cancelar
        </Link>
        <SubmitButton>{mode === "create" ? "Registrar estudiante" : "Guardar cambios"}</SubmitButton>
      </div>
    </form>
  );
}

/** Actualización de datos hecha por el propio estudiante. */
export function StudentSelfForm({
  action,
  initial,
}: {
  action: Action;
  initial: Partial<StudentFormValues>;
}) {
  const { state, formAction, value, errors } = useStudentFormState(action, initial);

  return (
    <form className="form-card" action={formAction} key={state.submittedAt} noValidate>
      <FormMessage state={state} />
      <PersonalFields value={value} errors={errors} required />
      <p className="form-note">
        <span className="field-required">*</span> Campos obligatorios.
      </p>
      <div className="form-actions">
        <Link className="btn btn-ghost" href="/panel">
          Volver al inicio
        </Link>
        <SubmitButton>Guardar cambios</SubmitButton>
      </div>
    </form>
  );
}
