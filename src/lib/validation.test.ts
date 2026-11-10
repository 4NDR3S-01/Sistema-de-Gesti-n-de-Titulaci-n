import { describe, expect, it } from "vitest";
import { isValidCedula, passwordChangeSchema } from "@/lib/validation";

describe("isValidCedula", () => {
  it("acepta cédulas con dígito verificador correcto", () => {
    expect(isValidCedula("1710034065")).toBe(true);
    expect(isValidCedula("1301234561")).toBe(true);
  });

  it("rechaza dígito verificador, provincia o formato inválidos", () => {
    expect(isValidCedula("1710034064")).toBe(false);
    expect(isValidCedula("9910034065")).toBe(false);
    expect(isValidCedula("17100340")).toBe(false);
    expect(isValidCedula("17A0034065")).toBe(false);
  });
});

describe("passwordChangeSchema", () => {
  const base = { currentPassword: "anterior1", newPassword: "nueva2024", confirmPassword: "nueva2024" };

  it("acepta un cambio válido", () => {
    expect(passwordChangeSchema.safeParse(base).success).toBe(true);
  });

  it("exige letras y números", () => {
    const result = passwordChangeSchema.safeParse({
      ...base,
      newPassword: "solamenteletras",
      confirmPassword: "solamenteletras",
    });
    expect(result.success).toBe(false);
  });

  it("exige que la confirmación coincida y que sea distinta de la actual", () => {
    expect(passwordChangeSchema.safeParse({ ...base, confirmPassword: "otra2024" }).success).toBe(false);
    expect(
      passwordChangeSchema.safeParse({
        currentPassword: "igual2024",
        newPassword: "igual2024",
        confirmPassword: "igual2024",
      }).success,
    ).toBe(false);
  });
});
