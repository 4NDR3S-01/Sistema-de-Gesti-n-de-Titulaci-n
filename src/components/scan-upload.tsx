"use client";

import { useActionState, useState } from "react";
import { FileUp } from "lucide-react";
import { uploadScanAction } from "@/app/(app)/registro-pat-2/actions";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { initialFormState } from "@/lib/form-state";

export function ScanUpload() {
  const [state, formAction] = useActionState(uploadScanAction, initialFormState);
  const [fileName, setFileName] = useState("");
  const error = state.errors?.scan?.[0];

  return (
    <form action={formAction} className="scan-upload" key={state.submittedAt}>
      {state.status === "error" && !error && <FormMessage state={state} />}
      <label className={`dropzone dropzone-inline${error ? " has-error" : ""}`}>
        <input
          type="file"
          name="scan"
          accept="application/pdf,.pdf"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
          required
        />
        <FileUp aria-hidden="true" />
        <strong>{fileName || "Selecciona el PDF firmado y escaneado"}</strong>
        <small>Un solo archivo PDF de hasta 5 MB con todas las páginas.</small>
      </label>
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
      <SubmitButton className="btn btn-secondary btn-sm" pendingLabel="Subiendo…">
        <FileUp aria-hidden="true" /> Subir escaneado
      </SubmitButton>
    </form>
  );
}
