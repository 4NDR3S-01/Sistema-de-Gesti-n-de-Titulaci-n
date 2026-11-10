import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ tokenVersion: 0 }));

vi.mock("@/lib/db", () => ({
  query: vi.fn(async () => [{ token_version: db.tokenVersion }]),
}));
vi.mock("@/lib/current-user", () => ({
  getCurrentUser: vi.fn(async () => null),
  loadActiveUser: vi.fn(async (id: number) => ({
    id,
    name: "Ana",
    lastname: "Pérez",
    email: "ana@live.uleam.edu.ec",
    role: "STUDENT",
  })),
}));

const { getRequestUser, issueToken } = await import("@/lib/api/http");

const bearer = (token: string) =>
  new Request("http://localhost/api", { headers: { authorization: `Bearer ${token}` } });

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "secreto-de-prueba");
  db.tokenVersion = 0;
});

describe("tokens de la app", () => {
  it("un token vigente identifica al usuario", async () => {
    const { token } = await issueToken(7);
    expect((await getRequestUser(bearer(token)))?.id).toBe(7);
  });

  it("al cambiar la contraseña (token_version + 1) el token anterior deja de valer", async () => {
    const { token } = await issueToken(7);
    db.tokenVersion = 1;
    expect(await getRequestUser(bearer(token))).toBeNull();
    const { token: fresh } = await issueToken(7);
    expect((await getRequestUser(bearer(fresh)))?.id).toBe(7);
  });

  it("rechaza tokens alterados", async () => {
    const { token } = await issueToken(7);
    const [header, payload, signature] = token.split(".");
    const forged = `${header}.${payload}.${signature.startsWith("A") ? "B" : "A"}${signature.slice(1)}`;
    expect(await getRequestUser(bearer(forged))).toBeNull();
  });
});
