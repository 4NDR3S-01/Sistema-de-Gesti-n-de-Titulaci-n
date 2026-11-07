/** Opciones del formato institucional PAT-04-F-002 (compartidas por cliente y servidor). */

export const patModalities = [
  "Trabajo de Integración Curricular - Proyecto de Investigación",
  "Trabajo de Integración Curricular - Desarrollo Tecnológico / Software",
  "Trabajo de Integración Curricular - Artículo Académico / Científico",
  "Trabajo de Integración Curricular - Proyecto de Vinculación",
  "Trabajo de Integración Curricular - Emprendimiento / Plan de Negocios",
  "Examen de Carácter Complexivo",
] as const;

export const patMechanisms = [
  "Proyecto de Investigación",
  "Proyecto de Vinculación con la Sociedad",
  "Artículo Académico / Científico",
  "Desarrollo Tecnológico / Software",
  "Examen Complexivo Teórico-Práctico",
] as const;

export const patArticulations = [
  { value: "investigacion", label: "Se articula con proyectos y programas de investigación" },
  { value: "vinculacion", label: "Se articula con proyectos y programas de vinculación" },
  { value: "docencia", label: "Se articula con proyectos de asignaturas (docencia)" },
  { value: "ninguna", label: "Ninguna" },
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

export const isComplexivo = (modality: string) => modality.includes("Complexivo");

/** Edad en años cumplidos a partir de una fecha AAAA-MM-DD. */
export function ageFrom(birthDate?: string | null): number | null {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}
