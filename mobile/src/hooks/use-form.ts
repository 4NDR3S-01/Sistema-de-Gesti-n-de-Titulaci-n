import { useState } from "react";
import { ApiError, type FieldErrors } from "@/lib/api";

/** Estado de un formulario: valores, errores por campo del servidor y envío. */
export function useForm(initial: Record<string, string> = {}) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const set = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  async function submit(action: (values: Record<string, string>) => Promise<unknown>): Promise<boolean> {
    setSubmitting(true);
    setMessage(undefined);
    try {
      await action(values);
      setErrors({});
      return true;
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(caught.fields);
        setMessage(caught.message);
      } else {
        setMessage("No se pudo guardar. Inténtalo de nuevo.");
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return { values, setValues, set, errors, message, submitting, submit };
}
