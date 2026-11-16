import { patLevels, type PatExtraData } from "@/lib/pat-options";

const levelBySemester: Record<number, (typeof patLevels)[number]> = {
  7: "Séptimo nivel",
  8: "Octavo nivel",
  9: "Noveno nivel",
  10: "Décimo nivel",
};

/**
 * Datos informativos con los que se prellena el formato PAT: lo que el estudiante
 * guardó en un registro anterior y, del semestre de su ficha, el nivel y el curso.
 * El nivel y el curso salen siempre de la ficha porque cambian cada semestre.
 */
export function personalDefaults(semester: number | null, saved: PatExtraData | null): PatExtraData {
  const fromProfile: PatExtraData = {};
  if (semester) {
    const level = semester > 10 ? "Egresado/a" : levelBySemester[semester];
    if (level) fromProfile.level = level;
    fromProfile.curso = `${semester}.º`;
  }
  const kept = Object.fromEntries(
    Object.entries(saved ?? {}).filter(([, value]) => typeof value === "string" && value.trim() !== ""),
  ) as PatExtraData;
  return { nationality: "Ecuatoriana", province: "Manabí", ...kept, ...fromProfile };
}
