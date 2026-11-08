/**
 * Protección básica de intentos de contraseña para una única instancia Node.js.
 * No consulta ni modifica PostgreSQL y no bloquea permanentemente ninguna cuenta.
 * Para despliegues con múltiples instancias/serverless, migrar estos contadores a Redis
 * o al limitador perimetral de la infraestructura.
 */
import "server-only";
import { createHash } from "node:crypto";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_BY_ID = 7;
const MAX_BY_IP = 30;
const MAX_ENTRIES = 5000;

type Attempt = { failures: number; expiresAt: number };
const attempts = new Map<string, Attempt>();

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function keys(identifier: string, request: Request): string[] {
  const result = [`id:${hash(identifier.trim().toLowerCase())}`];
  // Estas cabeceras deben proceder de un proxy inverso de confianza en producción.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = request.headers.get("x-real-ip")?.trim() || forwarded;
  if (ip) result.push(`ip:${hash(ip)}`);
  return result;
}

function current(key: string, now: number): Attempt | undefined {
  const entry = attempts.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= now) {
    attempts.delete(key);
    return undefined;
  }
  return entry;
}

function prune(now: number): void {
  for (const [key, entry] of attempts) {
    if (entry.expiresAt <= now) attempts.delete(key);
  }
  // Limita el consumo de memoria en procesos de desarrollo de larga duración.
  while (attempts.size > MAX_ENTRIES) {
    const oldest = attempts.keys().next().value;
    if (!oldest) break;
    attempts.delete(oldest);
  }
}

/**
 * Estado de bloqueo para informar un tiempo de espera aproximado.
 * Devuelve solo el bloqueo activo, nunca los contadores ni datos del usuario.
 * El servidor sigue decidiendo si la contraseña puede comprobarse.
 */
export function getLoginRateLimitStatus(identifier: string, request: Request): {
  blocked: boolean;
  waitSeconds: number;
} {
  const now = Date.now();
  let expiresAt = 0;
  for (const key of keys(identifier, request)) {
    const entry = current(key, now);
    if (!entry) continue;
    const limit = key.startsWith("ip:") ? MAX_BY_IP : MAX_BY_ID;
    if (entry.failures >= limit) expiresAt = Math.max(expiresAt, entry.expiresAt);
  }
  return {
    blocked: expiresAt > now,
    waitSeconds: expiresAt > now ? Math.ceil((expiresAt - now) / 1000) : 0,
  };
}

export function loginIsRateLimited(identifier: string, request: Request): boolean {
  const now = Date.now();
  return keys(identifier, request).some((key) => {
    const entry = current(key, now);
    return Boolean(entry && entry.failures >= (key.startsWith("ip:") ? MAX_BY_IP : MAX_BY_ID));
  });
}

export function recordFailedLogin(identifier: string, request: Request): void {
  const now = Date.now();
  prune(now);
  for (const key of keys(identifier, request)) {
    const previous = current(key, now);
    attempts.set(key, previous
      ? { ...previous, failures: previous.failures + 1 }
      : { failures: 1, expiresAt: now + WINDOW_MS });
  }
  prune(now);
}

export function clearSuccessfulLogin(identifier: string): void {
  attempts.delete(`id:${hash(identifier.trim().toLowerCase())}`);
  // No limpiar el contador por IP: otras solicitudes del origen pueden ser abusivas.
}
