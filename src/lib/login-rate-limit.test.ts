import { afterEach, describe, expect, it, vi } from "vitest";
import { clearSuccessfulLogin, clientIp, loginIsRateLimited, recordFailedLogin } from "@/lib/login-rate-limit";

const req = (headers: Record<string, string> = {}) => new Request("http://localhost/api", { headers });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("límite de intentos por identificador", () => {
  it("bloquea tras 7 fallos y se libera con un acceso correcto", () => {
    const id = "bloqueo@live.uleam.edu.ec";
    for (let i = 0; i < 6; i++) recordFailedLogin(id, req());
    expect(loginIsRateLimited(id, req())).toBe(false);
    recordFailedLogin(id, req());
    expect(loginIsRateLimited(id, req())).toBe(true);
    // Mayúsculas y espacios cuentan como el mismo identificador.
    expect(loginIsRateLimited(`  ${id.toUpperCase()} `, req())).toBe(true);
    clearSuccessfulLogin(id);
    expect(loginIsRateLimited(id, req())).toBe(false);
  });
});

describe("clientIp", () => {
  it("ignora las cabeceras si no hay proxy de confianza", () => {
    vi.stubEnv("TRUST_PROXY", "false");
    expect(clientIp(req({ "x-forwarded-for": "1.1.1.1", "x-real-ip": "2.2.2.2" }))).toBeUndefined();
  });

  it("con proxy de confianza usa X-Real-IP o la última entrada de X-Forwarded-For", () => {
    vi.stubEnv("TRUST_PROXY", "true");
    expect(clientIp(req({ "x-real-ip": "2.2.2.2" }))).toBe("2.2.2.2");
    // La primera entrada la envía el cliente (falsificable); la última, el proxy.
    expect(clientIp(req({ "x-forwarded-for": "6.6.6.6, 10.0.0.5" }))).toBe("10.0.0.5");
  });
});
