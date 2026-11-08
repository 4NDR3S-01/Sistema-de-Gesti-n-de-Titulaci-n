import "server-only";
import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import type { AppRole } from "@/lib/auth-roles";
import { getCurrentUser, loadActiveUser, type CurrentUser } from "@/lib/current-user";

const AUDIENCE = "uleam-titulacion-mobile";
const TOKEN_DAYS = 30;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET no está configurado");
  // Clave derivada: un token de la app nunca sirve como cookie web ni al revés.
  return new TextEncoder().encode(`${value}:mobile-api`);
}

export async function issueToken(userId: number): Promise<{ token: string; expiresAt: string }> {
  const expires = new Date(Date.now() + TOKEN_DAYS * 24 * 60 * 60 * 1000);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(secret());
  return { token, expiresAt: expires.toISOString() };
}

/** Usuario del token Bearer (app) o, si no hay, de la sesión web. Siempre releído de la base. */
export async function getRequestUser(request: Request): Promise<CurrentUser | null> {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    try {
      const { payload } = await jwtVerify(header.slice(7), secret(), { audience: AUDIENCE });
      return await loadActiveUser(Number(payload.sub));
    } catch {
      return null;
    }
  }
  return getCurrentUser();
}

export type ApiError = {
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string[] | undefined>;
};

export const ok = (data: unknown = { ok: true }, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export const fail = (error: ApiError) =>
  NextResponse.json(
    { error: { code: error.code, message: error.message, fields: error.fields } },
    { status: error.status, headers: { "Cache-Control": "no-store" } },
  );

/** Exige usuario (y rol). Devuelve el usuario o una respuesta de error lista para retornar. */
export async function requireApiUser(
  request: Request,
  roles?: readonly AppRole[],
): Promise<CurrentUser | NextResponse> {
  const user = await getRequestUser(request);
  if (!user) return fail({ status: 401, code: "unauthorized", message: "Tu sesión expiró. Inicia sesión de nuevo." });
  if (roles && !roles.includes(user.role)) {
    return fail({ status: 403, code: "forbidden", message: "No tienes permiso para esta acción." });
  }
  return user;
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Ejecuta un handler y convierte errores inesperados en 500 sin filtrar detalles. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error("[api]", error);
      return fail({ status: 500, code: "server_error", message: "Ocurrió un error en el servidor. Inténtalo de nuevo." });
    }
  };
}
