import type { PatExtraData } from "@/lib/pat-options";

export type PatStatus = "DRAFT" | "PENDING" | "RETURNED" | "APPROVED";
export type MemberRole = "LEADER" | "MEMBER";
export type MemberStatus = "INVITED" | "ACCEPTED" | "DECLINED";

/** Datos informativos obligatorios de cada integrante. */
export const requiredPersonalFields: (keyof PatExtraData)[] = [
  "level",
  "parallel",
  "birthDate",
  "nationality",
  "maritalStatus",
  "province",
  "canton",
];

export const isEditable = (status: PatStatus) => status === "DRAFT" || status === "RETURNED";

export function personalDataComplete(extra: PatExtraData | null | undefined): boolean {
  return requiredPersonalFields.every((field) => Boolean(extra?.[field]));
}

type MemberLike = {
  name: string;
  status: MemberStatus;
  extra_data: PatExtraData;
  signed: boolean;
};

export type Requirement = { key: string; label: string; done: boolean };

/**
 * Lo que falta para enviar el registro a revisión. La misma función se usa
 * para mostrar la lista al estudiante y para validar el envío en el servidor.
 */
export function submissionRequirements(input: {
  participationType: "INDIVIDUAL" | "GRUPAL";
  members: MemberLike[];
  hasScan: boolean;
}): Requirement[] {
  const active = input.members.filter((member) => member.status !== "DECLINED");
  const teammate = active.length > 1;
  const requirements: Requirement[] = [];

  if (input.participationType === "GRUPAL") {
    requirements.push({
      key: "teammate",
      label: teammate ? "Compañero/a agregado/a" : "Agregar a tu compañero/a de trabajo",
      done: teammate,
    });
    const invited = active.filter((member) => member.status === "INVITED");
    if (teammate) {
      requirements.push({
        key: "accepted",
        label: invited.length
          ? `${invited.map((member) => member.name).join(", ")} debe aceptar la invitación`
          : "Invitación aceptada",
        done: invited.length === 0,
      });
    }
  }

  for (const member of active.filter((item) => item.status === "ACCEPTED")) {
    requirements.push({
      key: `data-${member.name}`,
      label: `Datos informativos de ${member.name}`,
      done: personalDataComplete(member.extra_data),
    });
  }

  const unsigned = active.filter((member) => !member.signed).map((member) => member.name);
  requirements.push({
    key: "signatures",
    label: input.hasScan
      ? "Formato firmado y escaneado subido"
      : unsigned.length
        ? `Firma pendiente: ${unsigned.join(", ")}`
        : "Firmas de todos los integrantes",
    done: input.hasScan || (unsigned.length === 0 && active.length > 0),
  });

  return requirements;
}

export const canSubmit = (requirements: Requirement[]) => requirements.every((item) => item.done);

/** Texto legible de cada tipo de evento del historial. */
export const eventLabels: Record<string, string> = {
  CREATED: "Creó el registro",
  PROPOSAL_UPDATED: "Actualizó la propuesta",
  DATA_UPDATED: "Actualizó sus datos informativos",
  INVITED: "Invitó a un compañero/a",
  TEAMMATE_REMOVED: "Quitó al compañero/a",
  ACCEPTED: "Aceptó la invitación",
  DECLINED: "Rechazó la invitación",
  LEFT: "Salió del trabajo",
  SIGNED: "Firmó el formato",
  SIGNATURE_REMOVED: "Borró su firma",
  SIGNATURES_RESET: "Las firmas se anularon por cambios en el registro",
  SCAN_UPLOADED: "Subió el formato escaneado",
  SCAN_REMOVED: "Quitó el formato escaneado",
  SUBMITTED: "Envió el registro a revisión",
  RETURNED: "Devolvió el registro con observaciones",
  APPROVED: "Aprobó el tema",
  TRIBUNAL_ASSIGNED: "Asignó el tribunal de defensa",
  TRIBUNAL_REMOVED: "Eliminó la convocatoria",
};
