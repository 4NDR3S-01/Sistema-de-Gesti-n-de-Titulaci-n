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
