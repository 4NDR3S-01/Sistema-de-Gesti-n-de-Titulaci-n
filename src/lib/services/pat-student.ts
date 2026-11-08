import "server-only";
import type { CurrentUser } from "@/lib/current-user";
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
import { getStudentByUserId, type StudentRow } from "@/lib/data/students";
import { failure, invalid, success, type ServiceResult } from "@/lib/services/result";
import { patPersonalSchema, patProposalSchema } from "@/lib/validation";

export const MAX_SCAN_BYTES = 5 * 1024 * 1024;
const MAX_SIGNATURE_CHARS = 400_000;
const PNG_MAGIC = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const NOT_EDITABLE = failure(409, "not_editable", "El registro ya está en revisión o aprobado y no se puede modificar.");
const ONLY_LEADER = failure(403, "only_leader", "Esa acción solo la puede hacer quien creó el registro.");

type Membership = NonNullable<Awaited<ReturnType<typeof getActiveMembership>>>;
type Context = { student: StudentRow; membership: Membership | null };

async function context(user: CurrentUser): Promise<ServiceResult<Context>> {
  if (user.role !== "STUDENT") return failure(403, "forbidden", "Solo los estudiantes tienen registro PAT 2.");
  const student = await getStudentByUserId(user.id);
  if (!student) {
    return failure(404, "no_profile", "Tu perfil académico aún no está registrado. Comunícate con secretaría.");
  }
  return success({ student, membership: await getActiveMembership(student.id) });
}

/** Normaliza la entrada: acepta objetos JSON (app) o FormData convertido (web). */
function proposalInput(input: Record<string, unknown>) {
  const raw = input.articulations;
  const articulations = Array.isArray(raw)
    ? raw.map(String)
    : typeof raw === "string"
      ? raw.split(",").filter(Boolean)
      : [];
  return { ...input, articulations };
}

export async function createPat(user: CurrentUser, input: Record<string, unknown>): Promise<ServiceResult> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  if (ctx.data.membership) return failure(409, "already_member", "Ya formas parte de un registro PAT 2.");

  const proposal = patProposalSchema.safeParse(proposalInput(input));
  const personal = patPersonalSchema.safeParse(input);
  if (!proposal.success || !personal.success) {
    return invalid({
      ...(proposal.success ? {} : proposal.error.flatten().fieldErrors),
      ...(personal.success ? {} : personal.error.flatten().fieldErrors),
    });
  }
  try {
    await createRegistration(ctx.data.student.id, user.id, proposal.data, personal.data);
  } catch (error) {
    if (pgErrorCode(error) === "23505") return failure(409, "already_member", "Ya formas parte de un registro PAT 2.");
    throw error;
  }
  return success();
}

export async function editProposal(user: CurrentUser, input: Record<string, unknown>): Promise<ServiceResult> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const { membership, student } = ctx.data;
  if (!membership || membership.role !== "LEADER") return ONLY_LEADER;
  const proposal = patProposalSchema.safeParse(proposalInput(input));
  if (!proposal.success) return invalid(proposal.error.flatten().fieldErrors);
  return (await updateProposal(membership.registration_id, student.id, user.id, proposal.data)) ? success() : NOT_EDITABLE;
}

export async function editPersonal(user: CurrentUser, input: Record<string, unknown>): Promise<ServiceResult> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const { membership, student } = ctx.data;
  if (!membership || membership.status !== "ACCEPTED") {
    return failure(409, "not_member", "Primero acepta la invitación al registro.");
  }
  const personal = patPersonalSchema.safeParse(input);
  if (!personal.success) return invalid(personal.error.flatten().fieldErrors);
  return (await updatePersonal(membership.registration_id, student.id, user.id, personal.data)) ? success() : NOT_EDITABLE;
}

export async function removeDraft(user: CurrentUser): Promise<ServiceResult> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const { membership, student } = ctx.data;
  if (!membership || membership.role !== "LEADER") return ONLY_LEADER;
  return (await deleteDraft(membership.registration_id, student.id))
    ? success()
    : failure(409, "not_draft", "Solo se puede eliminar un registro en borrador.");
}

const inviteErrors: Record<string, ReturnType<typeof failure>> = {
  "not-editable": NOT_EDITABLE,
  "not-group": failure(409, "not_group", "Para invitar a alguien, cambia la propuesta a «En pareja»."),
  "invalid-teammate": failure(422, "invalid_teammate", "Ese estudiante no está disponible: debe estar activo y ser de tu carrera."),
  busy: failure(409, "teammate_busy", "Ese estudiante ya forma parte de otro registro PAT 2."),
};

export async function invite(user: CurrentUser, teammateStudentId: number): Promise<ServiceResult> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const { membership, student } = ctx.data;
  if (!membership || membership.role !== "LEADER") return ONLY_LEADER;
  if (!Number.isInteger(teammateStudentId) || teammateStudentId <= 0) return inviteErrors["invalid-teammate"];
  const result = await inviteTeammate(membership.registration_id, student.id, teammateStudentId, user.id);
  return result === "ok" ? success() : inviteErrors[result];
}

export async function dropTeammate(user: CurrentUser): Promise<ServiceResult> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const { membership, student } = ctx.data;
  if (!membership || membership.role !== "LEADER") return ONLY_LEADER;
  return (await removeTeammate(membership.registration_id, student.id, user.id)) ? success() : NOT_EDITABLE;
}

export async function answerInvitation(user: CurrentUser, accept: boolean): Promise<ServiceResult> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const { membership, student } = ctx.data;
  if (!membership || membership.status !== "INVITED") {
    return failure(409, "no_invitation", "La invitación ya no está disponible.");
  }
  return (await respondInvitation(membership.registration_id, student.id, user.id, accept)) ? success() : NOT_EDITABLE;
}

export async function leave(user: CurrentUser): Promise<ServiceResult> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const { membership, student } = ctx.data;
  if (!membership || membership.role !== "MEMBER") {
    return failure(403, "only_member", "Quien creó el registro no puede salir; puede eliminar el borrador.");
  }
  return (await leaveRegistration(membership.registration_id, student.id, user.id)) ? success() : NOT_EDITABLE;
}

export async function sign(user: CurrentUser, image: unknown, method: unknown): Promise<ServiceResult> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const { membership, student } = ctx.data;
  if (!membership || membership.status !== "ACCEPTED") {
    return failure(403, "not_member", "No eres integrante de este registro.");
  }
  if (method !== "DRAW" && method !== "PHOTO") return failure(422, "invalid_method", "Método de firma no válido.");

  const prefix = "data:image/png;base64,";
  if (typeof image !== "string" || !image.startsWith(prefix) || image.length > MAX_SIGNATURE_CHARS) {
    return failure(422, "invalid_signature", "La imagen de la firma no es válida o es demasiado grande.");
  }
  const bytes = Buffer.from(image.slice(prefix.length), "base64");
  if (bytes.length < 200 || !bytes.subarray(0, 8).equals(PNG_MAGIC)) {
    return failure(422, "invalid_signature", "La imagen de la firma no es válida.");
  }
  return (await saveSignature(membership.registration_id, student.id, user.id, image, method))
    ? success()
    : NOT_EDITABLE;
}

export async function unsign(user: CurrentUser): Promise<ServiceResult> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const { membership, student } = ctx.data;
  if (!membership) return failure(404, "no_registration", "No tienes un registro PAT 2.");
  return (await removeSignature(membership.registration_id, student.id, user.id)) ? success() : NOT_EDITABLE;
}

export async function uploadScan(user: CurrentUser, fileName: string, content: Buffer): Promise<ServiceResult> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const { membership } = ctx.data;
  if (!membership || membership.status !== "ACCEPTED") {
    return failure(403, "not_member", "No eres integrante de este registro.");
  }
  if (content.length === 0) return invalid({ scan: ["Selecciona el archivo PDF escaneado."] });
  if (content.length > MAX_SCAN_BYTES) {
    return invalid({ scan: ["El archivo supera 5 MB. Escanéalo con menor resolución."] });
  }
  if (!content.subarray(0, 5).equals(Buffer.from("%PDF-"))) return invalid({ scan: ["El archivo debe ser un PDF."] });
  return (await saveScan(membership.registration_id, user.id, fileName || "formato.pdf", content)) ? success() : NOT_EDITABLE;
}

export async function removeScan(user: CurrentUser): Promise<ServiceResult> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const { membership } = ctx.data;
  if (!membership) return failure(404, "no_registration", "No tienes un registro PAT 2.");
  return (await deleteScan(membership.registration_id, user.id)) ? success() : NOT_EDITABLE;
}

export async function submit(user: CurrentUser): Promise<ServiceResult> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const { membership, student } = ctx.data;
  if (!membership || membership.role !== "LEADER") return ONLY_LEADER;
  const result = await submitRegistration(membership.registration_id, student.id, user.id);
  if (!result.ok) {
    return failure(409, "incomplete", `Aún faltan requisitos: ${result.missing.join("; ")}.`);
  }
  return success();
}
