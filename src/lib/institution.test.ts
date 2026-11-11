import { describe, expect, it } from "vitest";
import { isInstitutionalEmail, isStudentEmail, parseLoginIdentifier } from "@/lib/institution";

describe("parseLoginIdentifier", () => {
  it("reconoce una cédula de 10 dígitos", () => {
    expect(parseLoginIdentifier(" 1710034065 ")).toEqual({ kind: "cedula", value: "1710034065" });
  });

  it("normaliza un correo completo", () => {
    expect(parseLoginIdentifier("Ana.Perez@LIVE.uleam.edu.ec")).toEqual({
      kind: "email",
      value: "ana.perez@live.uleam.edu.ec",
    });
  });

  it("rechaza usuarios sin dominio y textos vacíos", () => {
    expect(parseLoginIdentifier("ana.perez")).toBeNull();
    expect(parseLoginIdentifier("   ")).toBeNull();
    expect(parseLoginIdentifier("12345")).toBeNull();
  });
});

describe("dominios institucionales", () => {
  it("distingue estudiantes y personal", () => {
    expect(isStudentEmail("a@live.uleam.edu.ec")).toBe(true);
    expect(isStudentEmail("a@uleam.edu.ec")).toBe(false);
    expect(isInstitutionalEmail("a@uleam.edu.ec")).toBe(true);
    expect(isInstitutionalEmail("a@gmail.com")).toBe(false);
  });
});
