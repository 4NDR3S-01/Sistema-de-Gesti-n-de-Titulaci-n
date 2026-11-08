import type { Tone } from "@/lib/theme";
import type { PatStatus } from "@/lib/types";

const statusLabels: Record<PatStatus, string> = {
  DRAFT: "Borrador",
  PENDING: "En revisión",
  RETURNED: "Devuelto",
  APPROVED: "Aprobado",
};
export const statusLabel = (status: PatStatus) => statusLabels[status] ?? status;

export function statusTone(status: PatStatus): Tone {
  if (status === "PENDING") return "warning";
  if (status === "RETURNED") return "danger";
  if (status === "APPROVED") return "success";
  return "neutral";
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-EC", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Guayaquil",
  }).format(new Date(value));
}

/** Fecha AAAA-MM-DD en formato largo, sin desfase de zona horaria. */
export function longDate(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export const todayIso = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" }).format(new Date());

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("es-EC", { hour: "numeric", hourCycle: "h23", timeZone: "America/Guayaquil" }).format(new Date()),
  );
  return hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
}

export function ageFrom(birthDate?: string | null): number | null {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age;
}

export const eventLabels: Record<string, string> = {
  CREATED: "creó el registro",
  PROPOSAL_UPDATED: "actualizó la propuesta",
  DATA_UPDATED: "actualizó sus datos informativos",
  INVITED: "invitó a un compañero/a",
  TEAMMATE_REMOVED: "quitó al compañero/a",
  ACCEPTED: "aceptó la invitación",
  DECLINED: "rechazó la invitación",
  LEFT: "salió del trabajo",
  SIGNED: "firmó el formato",
  SIGNATURE_REMOVED: "borró su firma",
  SIGNATURES_RESET: "Las firmas se anularon por cambios en el registro",
  SCAN_UPLOADED: "subió el formato escaneado",
  SCAN_REMOVED: "quitó el formato escaneado",
  SUBMITTED: "envió el registro a revisión",
  RETURNED: "devolvió el registro con observaciones",
  APPROVED: "aprobó el tema",
  TRIBUNAL_ASSIGNED: "asignó el tribunal de defensa",
  TRIBUNAL_REMOVED: "eliminó la convocatoria",
};

export const requiredPersonalFields = ["level", "parallel", "birthDate", "nationality", "maritalStatus", "province", "canton"] as const;
