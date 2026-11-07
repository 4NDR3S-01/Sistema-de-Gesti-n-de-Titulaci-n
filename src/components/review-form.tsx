"use client";

import { useActionState, useState } from "react";
import { CircleCheck, Undo2 } from "lucide-react";
import { Field, FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState, type FormState } from "@/lib/form-state";

export function ReviewForm({
  action,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, initialFormState);
  const [decision, setDecision] = useState(state.values?.decision ?? "");
  const errors = state.errors ?? {};

  return (
    <form className="review-form" action={formAction} key={state.submittedAt} noValidate>
      <FormMessage state={state} />
      <div className="field" role="radiogroup" aria-label="Decisión">
        <label className="choice is-success">
          <input
            type="radio"
            name="decision"
            value="APPROVED"
            checked={decision === "APPROVED"}
            onChange={() => setDecision("APPROVED")}
          />
          <span>
            <strong>Aprobar tema</strong>
            <small>Se crea el proyecto de titulación y pasa a tribunales.</small>
          </span>
        </label>
        <label className="choice is-danger">
          <input
            type="radio"
            name="decision"
            value="RETURNED"
            checked={decision === "RETURNED"}
            onChange={() => setDecision("RETURNED")}
          />
          <span>
            <strong>Devolver para corrección</strong>
            <small>El estudiante podrá editar y reenviar su registro.</small>
          </span>
        </label>
        {errors.decision?.length ? <span className="field-error">{errors.decision[0]}</span> : null}
      </div>

      <Field
        label="Observaciones"
        name="observations"
        error={errors.observations}
        hint={decision === "RETURNED" ? "Obligatorias: indica qué debe corregir." : "Opcional al aprobar."}
        required={decision === "RETURNED"}
      >
        <textarea
          id="observations"
          name="observations"
          rows={5}
          maxLength={2000}
          defaultValue={state.values?.observations ?? ""}
        />
      </Field>

      <SubmitButton
        className={`btn btn-block ${
          decision === "RETURNED" ? "btn-danger" : decision === "APPROVED" ? "btn-success" : "btn-primary"
        }`}
        pendingLabel="Guardando…"
      >
        {decision === "RETURNED" ? (
          <>
            <Undo2 aria-hidden="true" /> Devolver registro
          </>
        ) : decision === "APPROVED" ? (
          <>
            <CircleCheck aria-hidden="true" /> Aprobar tema
          </>
        ) : (
          "Guardar decisión"
        )}
      </SubmitButton>
    </form>
  );
}
