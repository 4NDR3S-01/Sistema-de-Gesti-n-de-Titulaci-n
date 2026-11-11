import { describe, expect, it } from "vitest";
import { canSubmit, submissionRequirements, type MemberStatus } from "@/lib/pat-rules";

const fullData = {
  level: "9",
  parallel: "A",
  birthDate: "2000-01-01",
  nationality: "Ecuatoriana",
  maritalStatus: "SOLTERO",
  province: "Manabí",
  canton: "Manta",
};

const member = (
  name: string,
  overrides: { status?: MemberStatus; signed?: boolean; complete?: boolean } = {},
) => ({
  name,
  status: overrides.status ?? "ACCEPTED",
  signed: overrides.signed ?? true,
  extra_data: overrides.complete === false ? {} : fullData,
});

const ready = (input: Parameters<typeof submissionRequirements>[0]) => canSubmit(submissionRequirements(input));

describe("submissionRequirements", () => {
  it("un registro individual completo y firmado se puede enviar", () => {
    expect(ready({ participationType: "INDIVIDUAL", members: [member("Ana")], hasScan: false })).toBe(true);
  });

  it("falta la firma o los datos informativos", () => {
    expect(ready({ participationType: "INDIVIDUAL", members: [member("Ana", { signed: false })], hasScan: false })).toBe(false);
    expect(ready({ participationType: "INDIVIDUAL", members: [member("Ana", { complete: false })], hasScan: false })).toBe(false);
  });

  it("el escaneado reemplaza a las firmas digitales", () => {
    expect(ready({ participationType: "INDIVIDUAL", members: [member("Ana", { signed: false })], hasScan: true })).toBe(true);
  });

  it("un registro grupal exige un compañero/a que haya aceptado", () => {
    expect(ready({ participationType: "GRUPAL", members: [member("Ana")], hasScan: false })).toBe(false);
    expect(
      ready({
        participationType: "GRUPAL",
        members: [member("Ana"), member("Luis", { status: "INVITED", signed: false })],
        hasScan: false,
      }),
    ).toBe(false);
    expect(ready({ participationType: "GRUPAL", members: [member("Ana"), member("Luis")], hasScan: false })).toBe(true);
  });

  it("ignora a quien rechazó la invitación", () => {
    expect(
      ready({
        participationType: "INDIVIDUAL",
        members: [member("Ana"), member("Luis", { status: "DECLINED", signed: false })],
        hasScan: false,
      }),
    ).toBe(true);
  });
});
