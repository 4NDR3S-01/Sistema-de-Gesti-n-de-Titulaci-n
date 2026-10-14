"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState, type FormState } from "@/lib/form-state";

type CareerOption = { id: number; name: string; faculty: string };

export type StudentFormValues = {
  name: string;
  lastname: string;
  email: string;
  cedula: string;
  studentCode: string;
  careerId: string;
  semester: string;
  phone: string;
  enrollmentYear: string;
};

export function StudentForm({
  action,
  careers,
  initial,
  mode,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  careers: CareerOption[];
  initial?: StudentFormValues;
  mode: "create" | "edit";
}) {
  const [state, formAction] = useActionState(action, initialFormState);
  const value = (name: keyof StudentFormValues) =>
    state.values?.[name] ?? initial?.[name] ?? "";
  const errors = state.errors ?? {};
  const faculties = [...new Set(careers.map((career) => career.faculty))];

  return (
    <form className="form-card" action={formAction} key={state.submittedAt} noValidate>
      <FormMessage state={state} />

      <fieldset className="form-group">
        <legend>Datos personales</legend>
        <div className="form-grid">
          <Field label="Nombres" name="name" error={errors.name}>
            <input id="name" name="name" defaultValue={value("name")} required maxLength={100} autoComplete="given-name" />
          </Field>
          <Field label="Apellidos" name="lastname" error={errors.lastname}>
            <input id="lastname" name="lastname" defaultValue={value("lastname")} required maxLength={100} autoComplete="family-name" />
          </Field>
          <Field label="Cédula" name="cedula" error={errors.cedula} hint="10 dígitos, sin guiones.">
            <input id="cedula" name="cedula" defaultValue={value("cedula")} required inputMode="numeric" pattern="\d{10}" maxLength={10} />
          </Field>
          <Field label="Celular" name="phone" error={errors.phone} hint="Opcional. Ejemplo: 0991234567.">
            <input id="phone" name="phone" defaultValue={value("phone")} inputMode="tel" pattern="09\d{8}" maxLength={10} autoComplete="tel" />
          </Field>
          <Field label="Correo electrónico" name="email" error={errors.email} className="field-full">
            <input id="email" name="email" type="email" defaultValue={value("email")} required maxLength={150} autoComplete="email" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="form-group">
        <legend>Datos académicos</legend>
        <div className="form-grid">
          <Field label="Código de estudiante" name="studentCode" error={errors.studentCode}>
            <input id="studentCode" name="studentCode" defaultValue={value("studentCode")} required maxLength={50} />
          </Field>
          <Field label="Carrera" name="careerId" error={errors.careerId}>
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
            <Field label="Contraseña inicial" name="password" error={errors.password} hint="Mínimo 8 caracteres. Compártela de forma segura con el estudiante.">
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
