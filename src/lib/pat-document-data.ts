import type { PatDocumentData } from "@/components/pat-document";
import type { PatDetail, PatMember } from "@/lib/data/pat";

const sexLabel: Record<string, string> = { MASCULINO: "Masculino", FEMENINO: "Femenino" };

/** Versión del documento: cambia cada vez que se modifica el registro. */
export function documentVersion(updatedAt: Date): string {
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Guayaquil",
  }).format(updatedAt);
}

/** Datos del formato PAT-04-F-002 a partir del registro guardado. */
export function patDocumentData(detail: PatDetail, { withSignatures = true } = {}): PatDocumentData {
  const r = detail.registration;
  return {
    registrationId: r.id,
    version: documentVersion(r.updated_at),
    participationType: r.participation_type,
    modality: r.modality,
    presentationMechanism: r.presentation_mechanism,
    requestedTutor: r.requested_tutor,
    title: r.title,
    problem: r.problem,
    articulations: r.articulations,
    members: detail.members
      .filter((member) => member.status === "ACCEPTED")
      .map((member) => ({
        ...member.extra_data,
        fullName: `${member.name} ${member.lastname}`,
        cedula: member.cedula ?? "",
        sex: member.sex ? sexLabel[member.sex] ?? member.sex : "",
        faculty: member.faculty,
        career: member.career,
        institutionalEmail: member.email,
        personalEmail: member.personal_email ?? "",
        phone: member.phone ?? "",
        landline: member.landline ?? "",
        signature: withSignatures ? member.signature : null,
      })),
  };
}

export function proposalFormValues(detail: PatDetail): Record<string, string> {
  const r = detail.registration;
  return {
    modality: r.modality,
    participationType: r.participation_type,
    presentationMechanism: r.presentation_mechanism,
    requestedTutor: r.requested_tutor ?? "",
    title: r.title,
    problem: r.problem,
    articulations: r.articulations.join(","),
  };
}

export function personalFormValues(member: PatMember): Record<string, string> {
  return Object.fromEntries(
    Object.entries(member.extra_data).filter(([, value]) => typeof value === "string"),
  ) as Record<string, string>;
}
