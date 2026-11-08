import type { StepState } from "@/components/pat";
import { longDate, statusLabel, todayIso } from "@/lib/format";
import type { Student, StudentPat } from "@/lib/types";

export type NextStep = { text: string; action: string; route: "/cuenta/perfil" | "/(student)/registro" | "/pat/crear" };

/** Etapas del proceso y siguiente acción del estudiante (mismas reglas que la web). */
export function studentJourney(student: Student | null, pat: StudentPat | null) {
  const profileComplete = Boolean(
    student?.cedula && student.sex && student.personal_email && student.address && student.landline && student.phone,
  );
  const r = pat?.registration ?? null;
  const full = r && pat && "members" in pat ? pat : null;
  const invited = full?.membership.status === "INVITED";
  const teamReady = full
    ? r!.participation_type === "INDIVIDUAL" || (full.members.length > 1 && full.members.every((m) => m.status === "ACCEPTED"))
    : false;
  const submitted = r ? r.status === "PENDING" || r.status === "APPROVED" : false;
  const tribunal = full?.tribunal ?? null;
  const defended = tribunal ? tribunal.defense_date < todayIso() : false;
  const done = full ? full.requirements.filter((item) => item.done).length : 0;

  const steps: { title: string; detail: string; state: StepState }[] = [
    { title: "Datos personales", detail: profileComplete ? "Completos" : "Faltan datos en tu ficha", state: profileComplete ? "done" : "current" },
    {
      title: "Propuesta",
      detail: invited ? "Tienes una invitación" : !r ? "Modalidad, tema y problemática" : r.participation_type === "GRUPAL" ? (teamReady ? "En pareja, equipo listo" : "Esperando a tu compañero/a") : "Individual",
      state: invited ? "current" : r && teamReady ? "done" : r || profileComplete ? "current" : "upcoming",
    },
    {
      title: "Firmas y envío",
      detail: submitted ? "Enviado" : full && !invited && full.editable ? `${done} de ${full.requirements.length} requisitos` : "Firma y envía a secretaría",
      state: submitted ? "done" : r && teamReady && !invited ? "current" : "upcoming",
    },
    {
      title: "Revisión",
      detail: r && r.status !== "DRAFT" ? statusLabel(r.status) : "Secretaría académica",
      state: !r || invited ? "upcoming" : r.status === "APPROVED" ? "done" : r.status === "RETURNED" ? "blocked" : r.status === "PENDING" ? "current" : "upcoming",
    },
    {
      title: "Tribunal y defensa",
      detail: tribunal ? longDate(tribunal.defense_date) : "Designación y sustentación",
      state: defended ? "done" : tribunal || r?.status === "APPROVED" ? "current" : "upcoming",
    },
  ];

  let next: NextStep;
  if (!student) next = { text: "Pide a secretaría que registre tus datos de estudiante.", action: "Ver mi cuenta", route: "/cuenta/perfil" };
  else if (!profileComplete) next = { text: "Primero completa tu cédula y tus datos de contacto: aparecen en el formato oficial.", action: "Completar mis datos", route: "/cuenta/perfil" };
  else if (invited) next = { text: "Un compañero/a te invitó a su trabajo en pareja. Revisa la propuesta y responde.", action: "Ver invitación", route: "/(student)/registro" };
  else if (!r) next = { text: "Registra tu propuesta: modalidad, título provisional y problemática.", action: "Registrar mi tema", route: "/pat/crear" };
  else if (r.status === "RETURNED") next = { text: "Secretaría devolvió el registro con observaciones. Corrígelo y reenvíalo.", action: "Corregir registro", route: "/(student)/registro" };
  else if (r.status === "DRAFT") {
    const pending = full?.requirements.find((item) => !item.done);
    next = {
      text: full?.canSubmit ? "Todo está listo. Envía el registro a secretaría." : `Tu registro es un borrador. Siguiente: ${pending?.label.toLowerCase() ?? "revisa tu registro"}.`,
      action: full?.canSubmit ? "Enviar a revisión" : "Continuar registro",
      route: "/(student)/registro",
    };
  } else if (r.status === "PENDING") next = { text: "Secretaría está revisando tu registro. Verás la decisión aquí.", action: "Ver mi registro", route: "/(student)/registro" };
  else if (!tribunal) next = { text: "¡Tu tema fue aprobado! Secretaría asignará tu tribunal de defensa.", action: "Ver mi registro", route: "/(student)/registro" };
  else next = {
    text: defended ? "Tu defensa ya se realizó. ¡Felicitaciones por completar el proceso!" : `Tu defensa es el ${longDate(tribunal.defense_date)} a las ${tribunal.defense_time}.`,
    action: "Ver convocatoria",
    route: "/(student)/registro",
  };

  return { steps, next };
}
