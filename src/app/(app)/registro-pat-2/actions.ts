"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/current-user";
import { pgErrorCode } from "@/lib/db";
import {
  createRegistration,
  deleteDraft,
  deleteScan,
  getActiveMembership,
  inviteTeammate,
  leaveRegistration,
  removeSignature,
  removeTeammate,
  respondInvitation,
  saveScan,
  saveSignature,
  submitRegistration,
  updatePersonal,
  updateProposal,
} from "@/lib/data/pat";
import { getStudentByUserId } from "@/lib/data/students";
import { formResult, type FormState } from "@/lib/form-state";
import {
  formValues,
  patPersonalSchema,
  patProposalSchema,
  validationError,
} from "@/lib/validation";

const PATH = "/registro-pat-2";
const MAX_SCAN_BYTES = 5 * 1024 * 1024;
const MAX_SIGNATURE_CHARS = 400_000;

/** Estudiante de la sesión y su registro activo (si tiene). */
async function context() {
  const user = await requireUser(["STUDENT"]);
  const student = await getStudentByUserId(user.id);
  if (!student) redirect(PATH);
  const membership = await getActiveMembership(student.id);
  return { user, student, membership };
}

function refresh() {
  revalidatePath(PATH);
  revalidatePath("/panel");
  revalidatePath("/aprobacion-pat-2");
}

function done(flash: string): never {
  refresh();
  redirect(`${PATH}?ok=${flash}`);
}

function fail(code: string): never {
  redirect(`${PATH}?error=${code}`);
}

const parseProposal = (formData: FormData) =>
  patProposalSchema.safeParse({
    ...Object.fromEntries(formData),
    articulations: formData.getAll("articulations").map(String),
  });

/* ----------------------------------------------------------- Crear y editar */

export async function createPatAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, student, membership } = await context();
  if (membership) {
    return formResult({ status: "error", message: "Ya formas parte de un registro PAT 2." });
  }

  const proposal = parseProposal(formData);
  const personal = patPersonalSchema.safeParse(Object.fromEntries(formData));
  if (!proposal.success || !personal.success) {
    return validationError(formData, {
      ...(proposal.success ? {} : proposal.error.flatten().fieldErrors),
      ...(personal.success ? {} : personal.error.flatten().fieldErrors),
    });
  }

  try {
    await createRegistration(student.id, user.id, proposal.data, personal.data);
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      return formResult({ status: "error", message: "Ya formas parte de un registro PAT 2." });
    }
    console.error("Error al crear registro PAT 2", error);
    return formResult({
      status: "error",
      message: "No se pudo guardar el registro. Inténtalo de nuevo.",
      values: formValues(formData),
    });
  }
  done(proposal.data.participationType === "GRUPAL" ? "creado-grupal" : "creado");
}

export async function updateProposalAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, student, membership } = await context();
  if (!membership || membership.role !== "LEADER") {
    return formResult({ status: "error", message: "Solo quien creó el registro puede editar la propuesta." });
  }
  const proposal = parseProposal(formData);
  if (!proposal.success) return validationError(formData, proposal.error.flatten().fieldErrors);

  const saved = await updateProposal(membership.registration_id, student.id, user.id, proposal.data);
  if (!saved) {
    return formResult({ status: "error", message: "El registro ya está en revisión o aprobado." });
  }
  done("propuesta");
}

export async function updatePersonalAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, student, membership } = await context();
  if (!membership || membership.status !== "ACCEPTED") {
    return formResult({ status: "error", message: "Primero acepta la invitación." });
  }
  const personal = patPersonalSchema.safeParse(Object.fromEntries(formData));
  if (!personal.success) return validationError(formData, personal.error.flatten().fieldErrors);

  const saved = await updatePersonal(membership.registration_id, student.id, user.id, personal.data);
  if (!saved) {
    return formResult({ status: "error", message: "El registro ya está en revisión o aprobado." });
  }
  done("datos");
}

export async function deleteDraftAction(): Promise<void> {
  const { student, membership } = await context();
  if (!membership || membership.role !== "LEADER") fail("permiso");
  if (!(await deleteDraft(membership.registration_id, student.id))) fail("no-editable");
  done("eliminado");
}

/* ----------------------------------------------------------- Integrantes */

export async function inviteTeammateAction(teammateStudentId: number): Promise<void> {
  const { user, student, membership } = await context();
  if (!membership || membership.role !== "LEADER") fail("permiso");
  const result = await inviteTeammate(membership.registration_id, student.id, teammateStudentId, user.id);
  if (result !== "ok") fail(result);
  done("invitado");
}

export async function removeTeammateAction(): Promise<void> {
  const { user, student, membership } = await context();
  if (!membership || membership.role !== "LEADER") fail("permiso");
  if (!(await removeTeammate(membership.registration_id, student.id, user.id))) fail("no-editable");
  done("companero-quitado");
}

export async function respondInvitationAction(accept: boolean): Promise<void> {
  const { user, student, membership } = await context();
  if (!membership || membership.status !== "INVITED") fail("sin-invitacion");
  const ok = await respondInvitation(membership.registration_id, student.id, user.id, accept);
  if (!ok) fail("no-editable");
  done(accept ? "aceptado" : "rechazado");
}

export async function leaveRegistrationAction(): Promise<void> {
  const { user, student, membership } = await context();
  if (!membership || membership.role !== "MEMBER") fail("permiso");
  if (!(await leaveRegistration(membership.registration_id, student.id, user.id))) fail("no-editable");
  done("salio");
}

/* ----------------------------------------------------------- Firmas */

export async function saveSignatureAction(
  signature: string,
  method: "DRAW" | "PHOTO",
): Promise<{ error?: string }> {
  const { user, student, membership } = await context();
  if (!membership || membership.status !== "ACCEPTED") return { error: "No eres integrante de este registro." };
  if (method !== "DRAW" && method !== "PHOTO") return { error: "Método de firma no válido." };

  const prefix = "data:image/png;base64,";
  if (!signature.startsWith(prefix) || signature.length > MAX_SIGNATURE_CHARS) {
    return { error: "La imagen de la firma no es válida o es demasiado grande." };
  }
  const bytes = Buffer.from(signature.slice(prefix.length), "base64");
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!isPng || bytes.length < 200) return { error: "La imagen de la firma no es válida." };

  const saved = await saveSignature(membership.registration_id, student.id, user.id, signature, method);
  if (!saved) return { error: "El registro ya no se puede firmar." };
  refresh();
  return {};
}

export async function removeSignatureAction(): Promise<void> {
  const { user, student, membership } = await context();
  if (!membership) fail("permiso");
  if (!(await removeSignature(membership.registration_id, student.id, user.id))) fail("no-editable");
  done("firma-borrada");
}

/* ----------------------------------------------------------- Escaneado */

export async function uploadScanAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, membership } = await context();
  if (!membership || membership.status !== "ACCEPTED") {
    return formResult({ status: "error", message: "No eres integrante de este registro." });
  }
  const file = formData.get("scan");
  if (!(file instanceof File) || file.size === 0) {
    return validationError(formData, { scan: ["Selecciona el archivo PDF escaneado."] });
  }
  if (file.size > MAX_SCAN_BYTES) {
    return validationError(formData, { scan: ["El archivo supera 5 MB. Escanéalo con menor resolución."] });
  }
  const content = Buffer.from(await file.arrayBuffer());
  if (!content.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    return validationError(formData, { scan: ["El archivo debe ser un PDF."] });
  }

  const saved = await saveScan(membership.registration_id, user.id, file.name || "formato.pdf", content);
  if (!saved) return formResult({ status: "error", message: "El registro ya no se puede modificar." });
  done("escaneado");
}

export async function deleteScanAction(): Promise<void> {
  const { user, membership } = await context();
  if (!membership) fail("permiso");
  if (!(await deleteScan(membership.registration_id, user.id))) fail("no-editable");
  done("escaneado-quitado");
}

/* ----------------------------------------------------------- Envío */

export async function submitPatAction(): Promise<void> {
  const { user, student, membership } = await context();
  if (!membership || membership.role !== "LEADER") fail("permiso");
  const result = await submitRegistration(membership.registration_id, student.id, user.id);
  if (!result.ok) fail("incompleto");
  done("enviado");
}
