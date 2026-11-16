/** Opciones del formato institucional PAT-04-F-002 (compartidas por cliente y servidor). */

export const patApprovalOptions = [
  "Trabajo de Integración Curricular",
  "Examen de carácter complexivo",
  "Trabajo de titulación",
  "NA",
] as const;

export const patModalities = [
  "Análisis de casos",
  "Desarrollo o Implementación de proceso, producto, servicio, patente, software.",
  "Dispositivos tecnológicos",
  "Emprendimientos",
  "Ensayos o artículos académicos",
  "Escritura de Artículo Científico o Capítulo de Libro",
  "Estudio de caso",
  "Estudios comparados",
  "Etnografías",
  "Modelos de negocios",
  "Prácticas de investigación y/o intervención",
  "Productos o presentaciones artísticas",
  "Propuestas metodológicas",
  "Propuestas tecnológicas",
  "Proyecto de emprendimiento",
  "Proyecto de inversión",
  "Proyectos de investigación",
  "Proyectos Integradores",
  "Proyectos técnicos",
  "Servicio social educativo",
  "Sistematización de experiencias",
  "TEFL Application Process",
  "TEFL in Community Service (Servicio Social Comunitario)",
  "Trabajos experimentales",
] as const;

export const patArticulations = [
  {
    value: "investigacion",
    label: "Se articula con proyectos y programas de investigación",
    pdfLabel:
      "Trabajo de Integración Curricular se articula con proyectos y programas de Investigación:",
  },
  {
    value: "vinculacion",
    label: "Se articula con proyectos y programas de vinculación",
    pdfLabel:
      "Trabajo de Integración Curricular se articula con proyectos y programas de Vinculación:",
  },
  {
    value: "docencia",
    label: "Se articula con proyectos de asignaturas (docencia)",
    pdfLabel:
      "Trabajo de Integración Curricular se articula con proyectos de asignaturas (Docencia):",
  },
  {
    value: "ninguna",
    label: "Ninguna",
    pdfLabel: "Ninguna:",
  },
] as const;

export type PatArticulation = (typeof patArticulations)[number]["value"];

export const patLevels = [
  "Séptimo nivel",
  "Octavo nivel",
  "Noveno nivel",
  "Décimo nivel",
  "Egresado/a",
] as const;

export const patParallels = ["A", "B", "C", "D", "Único"] as const;

export const maritalStatuses = [
  "Soltero/a",
  "Casado/a",
  "Unión de hecho",
  "Divorciado/a",
  "Viudo/a",
] as const;

export const disabilityTypes = [
  "Visual",
  "Física",
  "Auditiva",
  "Intelectual",
  "Psicológica",
  "Lengua",
  "Otras",
] as const;

export const ecuadorProvinces = [
  "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi", "El Oro",
  "Esmeraldas", "Galápagos", "Guayas", "Imbabura", "Loja", "Los Ríos", "Manabí",
  "Morona Santiago", "Napo", "Orellana", "Pastaza", "Pichincha", "Santa Elena",
  "Santo Domingo de los Tsáchilas", "Sucumbíos", "Tungurahua", "Zamora Chinchipe",
] as const;

/** Datos del formato que no están en la ficha del estudiante. */
export type PatExtraData = {
  level?: string;
  curso?: string;
  parallel?: string;
  birthDate?: string;
  nationality?: string;
  maritalStatus?: string;
  votingCertificate?: string;
  province?: string;
  canton?: string;
  parish?: string;
  disabilityType?: string;
  disabilityDegree?: string;
};

export const isComplexivo = (approvalOption: string) =>
  approvalOption.toLowerCase().includes("complexivo");

/** Edad en años cumplidos a partir de una fecha AAAA-MM-DD. */
export function ageFrom(birthDate?: string | null): number | null {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}
