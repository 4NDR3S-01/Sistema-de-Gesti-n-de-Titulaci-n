import "server-only";
import type { CurrentUser } from "@/lib/current-user";
import { countRegistrationsByStatus, getPatDetailForStudent } from "@/lib/data/pat";
import { getStudentByUserId } from "@/lib/data/students";
import { listApprovedWithoutTribunal } from "@/lib/data/tribunals";
import { isEditable } from "@/lib/pat-rules";

export type AppNotification = {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "info" | "warning" | "danger" | "success";
};

/** Lo que requiere la atención del usuario ahora mismo (se calcula, no se almacena). */
export async function getNotifications(user: CurrentUser): Promise<AppNotification[]> {
  if (user.role !== "STUDENT") {
    const [counts, withoutTribunal] = await Promise.all([
      countRegistrationsByStatus(),
      listApprovedWithoutTribunal(),
    ]);
    const items: AppNotification[] = [];
    if (counts.PENDING > 0) {
      items.push({
        id: "pending",
        title: `${counts.PENDING} ${counts.PENDING === 1 ? "registro por revisar" : "registros por revisar"}`,
        detail: "Registros PAT 2 enviados por los estudiantes.",
        href: "/aprobacion-pat-2?estado=PENDING",
        tone: "warning",
      });
    }
    if (withoutTribunal.length > 0) {
      items.push({
        id: "tribunal",
        title: `${withoutTribunal.length} ${withoutTribunal.length === 1 ? "tema espera tribunal" : "temas esperan tribunal"}`,
        detail: "Temas aprobados sin convocatoria a la defensa.",
        href: "/tribunales",
        tone: "info",
      });
    }
    return items;
  }

  const student = await getStudentByUserId(user.id);
  if (!student) {
    return [
      {
        id: "no-profile",
        title: "Tu perfil académico no está registrado",
        detail: "Pide a secretaría que registre tus datos de estudiante.",
        href: "/panel",
        tone: "warning",
      },
    ];
  }

  const items: AppNotification[] = [];
  if (!student.cedula || !student.phone || !student.personal_email) {
    items.push({
      id: "profile",
      title: "Completa tus datos personales",
      detail: "Se usan en el formato oficial de tu registro.",
      href: "/perfil",
      tone: "info",
    });
  }

  const detail = await getPatDetailForStudent(student.id);
  if (!detail) return items;
  const { registration: r, members, membership } = detail;
  const leader = members.find((member) => member.role === "LEADER");
  const me = members.find((member) => member.student_id === student.id);

  if (membership.status === "INVITED") {
    items.push({
      id: "invitation",
      title: `${leader?.name ?? "Un compañero/a"} te invitó a su trabajo`,
      detail: "Revisa la propuesta y acepta o rechaza.",
      href: "/registro-pat-2",
      tone: "warning",
    });
    return items;
  }

  if (r.status === "RETURNED") {
    items.push({
      id: "returned",
      title: "Te devolvieron el registro",
      detail: r.observations ?? "Revisa las observaciones de secretaría.",
      href: "/registro-pat-2",
      tone: "danger",
    });
  }

  const teamReady = members.every((member) => member.status === "ACCEPTED");
  if (isEditable(r.status) && teamReady && me && !me.signature && !detail.scan) {
    items.push({
      id: "signature",
      title: "Falta tu firma",
      detail: "Firma el formato para poder enviarlo a revisión.",
      href: "/registro-pat-2",
      tone: "info",
    });
  }

  if (r.status === "APPROVED") {
    items.push({
      id: "approved",
      title: r.has_tribunal ? "Tienes convocatoria a la defensa" : "Tu tema fue aprobado",
      detail: r.has_tribunal ? "Revisa fecha, hora y lugar." : "Secretaría asignará tu tribunal.",
      href: "/registro-pat-2",
      tone: "success",
    });
  }
  return items;
}
