"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { changePasswordAction } from "@/app/(app)/cuenta/actions";
import { Field, FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState } from "@/lib/form-state";

export function PasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initialFormState);
  const errors = state.errors ?? {};
  return (
    <form className="form-card" action={formAction} key={state.submittedAt} noValidate>
      <FormMessage state={state} />
      <fieldset className="form-group">
        <div className="form-group-intro">
          <h2>Cambiar contraseña</h2>
          <p>Mínimo 8 caracteres, combinando letras y números. No la compartas con nadie.</p>
        </div>
        <div className="form-grid">
          <Field label="Contraseña actual" name="currentPassword" error={errors.currentPassword} className="field-full" required>
            <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
          </Field>
          <Field label="Nueva contraseña" name="newPassword" error={errors.newPassword} required>
            <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
          </Field>
          <Field label="Repite la nueva contraseña" name="confirmPassword" error={errors.confirmPassword} required>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
          </Field>
        </div>
      </fieldset>
      <div className="form-actions">
        <SubmitButton pendingLabel="Actualizando…">
          <KeyRound aria-hidden="true" /> Cambiar contraseña
        </SubmitButton>
      </div>
    </form>
  );
}
