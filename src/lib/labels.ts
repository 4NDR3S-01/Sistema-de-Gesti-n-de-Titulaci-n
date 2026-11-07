const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  IN_REVIEW: "En revisión",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  COMPLETED: "Finalizado",
  PROPOSED: "Propuesto",
  IN_PROGRESS: "En desarrollo",
  DEFENDED: "Defendido",
  SIN_ESTADO: "Sin estado",
};

const stageLabels: Record<string, string> = {
  INICIO: "Inicio",
  REVISION_DOCUMENTOS: "Revisión de documentos",
  DESIGNACION_JURADO: "Designación de tribunal",
  DEFENSA: "Defensa",
  FINALIZADO: "Finalizado",
};

const procedureTypeLabels: Record<string, string> = {
  TESIS: "Trabajo de titulación",
  EXAMEN_PROFESIONAL: "Examen complexivo",
  DIPLOMADO: "Diplomado",
  EXCELENCIA_ACADEMICA: "Excelencia académica",
};

const humanize = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");

export const statusLabel = (value: string) => statusLabels[value] ?? humanize(value);
export const stageLabel = (value: string) => stageLabels[value] ?? humanize(value);
export const procedureTypeLabel = (value: string) =>
  procedureTypeLabels[value] ?? humanize(value);

export function statusTone(value: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (["APPROVED", "COMPLETED", "DEFENDED"].includes(value)) return "success";
  if (["REJECTED"].includes(value)) return "danger";
  if (["IN_REVIEW", "IN_PROGRESS"].includes(value)) return "info";
  if (["PENDING", "PROPOSED"].includes(value)) return "warning";
  return "neutral";
}

const patStatusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING: "En revisión",
  RETURNED: "Devuelto con observaciones",
  APPROVED: "Aprobado",
};

export const patStatusLabel = (value: string) => patStatusLabels[value] ?? humanize(value);

export function patStatusTone(value: string): "warning" | "danger" | "success" | "neutral" {
  if (value === "PENDING") return "warning";
  if (value === "RETURNED") return "danger";
  if (value === "APPROVED") return "success";
  return "neutral";
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

export function shortDateTime(value: Date): string {
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Guayaquil",
  }).format(value);
}
