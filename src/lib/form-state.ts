/** Estado que devuelven las Server Actions de formularios. */
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
  /** Marca de cada respuesta; los formularios la usan como `key` para volver a montarse. */
  submittedAt?: number;
};

export const initialFormState: FormState = { status: "idle" };

/**
 * Respuesta de una Server Action. Tras enviar, React reinicia el formulario y
 * los `<select>` vuelven a su primera opción; con una marca nueva el formulario
 * se vuelve a montar con los valores enviados.
 */
export function formResult(state: Omit<FormState, "submittedAt">): FormState {
  return { ...state, submittedAt: Date.now() };
}
