"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { formResult, type FormState } from "@/lib/form-state";
import {
  answerInvitation,
  createPat,
  dropTeammate,
  editPersonal,
  editProposal,
  invite,
  leave,
  removeDraft,
  removeScan,
  sign,
  submit,
  unsign,
  uploadScan,
} from "@/lib/services/pat-student";
import type { ServiceResult } from "@/lib/services/result";
import { formValues } from "@/lib/validation";

// Las reglas viven en lib/services/pat-student.ts: las comparten la web y la API de la app.

const PATH = "/registro-pat-2";

function refresh() {
  revalidatePath(PATH);
  revalidatePath("/panel");
  revalidatePath("/aprobacion-pat-2");
}

/** Resultado de un formulario: errores por campo o redirección con mensaje. */
function toForm(result: ServiceResult, formData: FormData, flash: string): FormState {
  if (!result.ok) {
    return formResult({
      status: "error",
      message: result.message,
      errors: result.fields,
      values: formValues(formData),
    });
  }
  refresh();
  redirect(`${PATH}?ok=${flash}`);
}

/** Resultado de un botón: siempre vuelve a la página con un mensaje. */
function toRedirect(result: ServiceResult, flash: string): never {
  if (!result.ok) redirect(`${PATH}?error=${result.code}`);
  refresh();
  redirect(`${PATH}?ok=${flash}`);
}

const entries = (formData: FormData) => ({
  ...Object.fromEntries(formData),
  articulations: formData.getAll("articulations").map(String),
});

export async function createPatAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(["STUDENT"]);
  const result = await createPat(user, entries(formData));
  return toForm(result, formData, formData.get("participationType") === "GRUPAL" ? "creado-grupal" : "creado");
}

export async function updateProposalAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(["STUDENT"]);
  return toForm(await editProposal(user, entries(formData)), formData, "propuesta");
}

export async function updatePersonalAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(["STUDENT"]);
  return toForm(await editPersonal(user, Object.fromEntries(formData)), formData, "datos");
}

export async function deleteDraftAction(): Promise<void> {
  toRedirect(await removeDraft(await requireUser(["STUDENT"])), "eliminado");
}

export async function inviteTeammateAction(teammateStudentId: number): Promise<void> {
  toRedirect(await invite(await requireUser(["STUDENT"]), teammateStudentId), "invitado");
}

export async function removeTeammateAction(): Promise<void> {
  toRedirect(await dropTeammate(await requireUser(["STUDENT"])), "companero-quitado");
}

export async function respondInvitationAction(accept: boolean): Promise<void> {
  toRedirect(await answerInvitation(await requireUser(["STUDENT"]), accept), accept ? "aceptado" : "rechazado");
}

export async function leaveRegistrationAction(): Promise<void> {
  toRedirect(await leave(await requireUser(["STUDENT"])), "salio");
}

export async function saveSignatureAction(signature: string, method: "DRAW" | "PHOTO"): Promise<{ error?: string }> {
  const result = await sign(await requireUser(["STUDENT"]), signature, method);
  if (!result.ok) return { error: result.message };
  refresh();
  return {};
}

export async function removeSignatureAction(): Promise<void> {
  toRedirect(await unsign(await requireUser(["STUDENT"])), "firma-borrada");
}

export async function uploadScanAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(["STUDENT"]);
  const file = formData.get("scan");
  if (!(file instanceof File) || file.size === 0) {
    return formResult({ status: "error", message: "Revisa los campos marcados.", errors: { scan: ["Selecciona el archivo PDF escaneado."] } });
  }
  const result = await uploadScan(user, file.name, Buffer.from(await file.arrayBuffer()));
  return toForm(result, new FormData(), "escaneado");
}

export async function deleteScanAction(): Promise<void> {
  toRedirect(await removeScan(await requireUser(["STUDENT"])), "escaneado-quitado");
}

export async function submitPatAction(): Promise<void> {
  toRedirect(await submit(await requireUser(["STUDENT"])), "enviado");
}
