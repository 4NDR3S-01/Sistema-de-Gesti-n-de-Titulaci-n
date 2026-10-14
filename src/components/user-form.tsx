"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState, type FormState } from "@/lib/form-state";

export function UserForm({
  action,
  mode,
  initial,
  currentRoleLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  mode: "create" | "edit";
  initial?: { name: string; lastname: string; email: string; role: string };
  /** Descripción del rol actual cuando no es ADMIN ni SECRETARY. */
  currentRoleLabel?: string;
}) {
  const [state, formAction] = useActionState(action, initialFormState);
  const errors = state.errors ?? {};
  const value = (name: "name" | "lastname" | "email" | "role") =>
    state.values?.[name] ?? initial?.[name] ?? "";
  const roleValue = ["ADMIN", "SECRETARY"].includes(value("role")) ? value("role") : "";

  return (
    <form className="form-card" action={formAction} key={state.submittedAt} noValidate>
      <FormMessage state={state} />

      <fieldset className="form-group">
        <legend>Datos del usuario</legend>
        <div className="form-grid">
          <Field label="Nombres" name="name" error={errors.name}>
            <input id="name" name="name" defaultValue={value("name")} required maxLength={100} />
          </Field>
          <Field label="Apellidos" name="lastname" error={errors.lastname}>
            <input id="lastname" name="lastname" defaultValue={value("lastname")} required maxLength={100} />
          </Field>
          <Field label="Correo electrónico" name="email" error={errors.email}>
            <input id="email" name="email" type="email" defaultValue={value("email")} required maxLength={150} />
          </Field>
          <Field
            label="Rol"
            name="role"
            error={errors.role}
            hint={currentRoleLabel ? `Rol actual: ${currentRoleLabel}.` : undefined}
          >
            <select id="role" name="role" defaultValue={roleValue} required={mode === "create"}>
              {(mode === "create" || currentRoleLabel) && (
                <option value="">{mode === "create" ? "Selecciona un rol" : "Mantener rol actual"}</option>
              )}
              <option value="SECRETARY">Secretaría</option>
              <option value="ADMIN">Administración</option>
            </select>
          </Field>
        </div>
      </fieldset>

      <fieldset className="form-group">
        <legend>{mode === "create" ? "Acceso" : "Restablecer contraseña"}</legend>
        <div className="form-grid">
          <Field
            label={mode === "create" ? "Contraseña inicial" : "Nueva contraseña"}
            name="password"
            error={errors.password}
            hint={mode === "create" ? "Mínimo 8 caracteres." : "Déjala vacía para mantener la actual."}
          >
            <input id="password" name="password" type="password" minLength={8} maxLength={72} required={mode === "create"} autoComplete="new-password" />
          </Field>
        </div>
      </fieldset>

      <div className="form-actions">
        <Link className="btn btn-ghost" href="/admin/usuarios">
          Cancelar
        </Link>
        <SubmitButton>{mode === "create" ? "Crear usuario" : "Guardar cambios"}</SubmitButton>
      </div>
    </form>
  );
}
