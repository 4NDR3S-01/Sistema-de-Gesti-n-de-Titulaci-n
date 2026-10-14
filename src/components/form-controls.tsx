"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import type { FormState } from "@/lib/form-state";

export function Field({
  label,
  name,
  error,
  hint,
  className,
  required,
  children,
}: {
  label: string;
  name: string;
  error?: string[];
  hint?: string;
  className?: string;
  /** Muestra el asterisco de campo obligatorio. */
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`field${error?.length ? " has-error" : ""}${className ? ` ${className}` : ""}`}>
      <label htmlFor={name}>
        {label}
        {required && (
          <span className="field-required" aria-hidden="true">
            {" "}*
          </span>
        )}
      </label>
      {children}
      {error?.length ? (
        <span className="field-error" id={`${name}-error`}>
          {error[0]}
        </span>
      ) : (
        hint && <span className="field-hint">{hint}</span>
      )}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Guardando…",
  className = "btn btn-primary",
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <div
      className={`alert alert-${state.status === "success" ? "success" : "error"}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      <span>{state.message}</span>
    </div>
  );
}

/** Botón que pide confirmación antes de enviar su formulario. */
export function ConfirmButton({
  message,
  className,
  children,
}: {
  message: string;
  className: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
