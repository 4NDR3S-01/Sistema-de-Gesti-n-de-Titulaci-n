import { describe, expect, it } from "vitest";
import { personalDefaults } from "@/lib/pat-defaults";

describe("personalDefaults", () => {
  it("deriva nivel y curso del semestre para un estudiante sin datos previos", () => {
    expect(personalDefaults(9, null)).toEqual({
      nationality: "Ecuatoriana",
      province: "Manabí",
      level: "Noveno nivel",
      curso: "9.º",
    });
  });

  it("reutiliza los datos guardados antes, pero el nivel sale de la ficha actual", () => {
    const saved = { level: "Octavo nivel", curso: "8.º", birthDate: "2001-05-04", canton: "Manta", parish: "" };
    expect(personalDefaults(10, saved)).toEqual({
      nationality: "Ecuatoriana",
      province: "Manabí",
      level: "Décimo nivel",
      curso: "10.º",
      birthDate: "2001-05-04",
      canton: "Manta",
    });
  });

  it("marca como egresado/a a quien pasó del décimo semestre y no inventa nivel sin semestre", () => {
    expect(personalDefaults(11, null).level).toBe("Egresado/a");
    expect(personalDefaults(null, null)).toEqual({ nationality: "Ecuatoriana", province: "Manabí" });
    expect(personalDefaults(5, null).level).toBeUndefined();
  });
});
