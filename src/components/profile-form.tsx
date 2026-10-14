"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState, type FormState } from "@/lib/form-state";

export function ProfileForm({
  action,
  email,
  phone,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  email: string;
  phone: string;
}) {
  const [state, formAction] = useActionState(action, initialFormState);
  const errors = state.errors ?? {};

  return (
    <form className="form-card" action={formAction} key={state.submittedAt} noValidate>
      <FormMessage state={state} />
      <fieldset className="form-group">
        <legend>Datos de contacto</legend>
        <div className="form-grid">
          <Field label="Correo electrónico" name="email" error={errors.email} hint="También lo usas para iniciar sesión.">
            <input id="email" name="email" type="email" defaultValue={state.values?.email ?? email} required maxLength={150} autoComplete="email" />
          </Field>
          <Field label="Celular" name="phone" error={errors.phone} hint="Ejemplo: 0991234567.">
            <input id="phone" name="phone" defaultValue={state.values?.phone ?? phone} inputMode="tel" pattern="09\d{8}" maxLength={10} autoComplete="tel" />
          </Field>
        </div>
      </fieldset>
      <div className="form-actions">
        <SubmitButton>Guardar cambios</SubmitButton>
      </div>
    </form>
  );
}
